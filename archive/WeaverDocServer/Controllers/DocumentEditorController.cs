using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using System;
using System.Text;
using System.Linq;
using System.IO;
using System.Diagnostics;
using Syncfusion.EJ2.DocumentEditor;               // SFDT processing
using EJ2FormatType = Syncfusion.EJ2.DocumentEditor.FormatType;
using EJ2WordDocument = Syncfusion.EJ2.DocumentEditor.WordDocument;
using DocIOWordDocument = Syncfusion.DocIO.DLS.WordDocument; // DocIO model (load DOCX)
using DocIOFormatType = Syncfusion.DocIO.FormatType;
using Syncfusion.DocIORenderer;                    // DOCX -> PDF renderer

namespace WeaverDocServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class DocumentEditorController : ControllerBase
{
    private readonly ILogger<DocumentEditorController> _logger;

    public DocumentEditorController(ILogger<DocumentEditorController> logger)
    {
        _logger = logger;
    }
    // Health/diagnostics: GET /api/documenteditor/SystemProperties
    [HttpGet("SystemProperties")]
    public IActionResult SystemProperties()
    {
        var info = new
        {
            Machine = Environment.MachineName,
            OS = Environment.OSVersion.ToString(),
            Framework = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
            ProcessArch = System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture.ToString(),
            Time = DateTimeOffset.Now,
        };
        return Ok(info);
    }

    // Minimal Import endpoint (SFDT only): POST /api/documenteditor/Import
    // Accepts text/json/body and returns the same SFDT back
    [HttpPost("Import")]
    public IActionResult Import()
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var body = reader.ReadToEnd();
        if (string.IsNullOrWhiteSpace(body))
        {
            return BadRequest(new { error = "Empty request body" });
        }
        // Echo back as SFDT JSON
        return Content(body, "application/json", Encoding.UTF8);
    }

    // Export endpoint: POST /api/documenteditor/Export
    // Request JSON: { format: 'Docx'|'Pdf'|'Sfdt', data: '<sfdt json string>', fileName?: string }
    // Behavior:
    //  * If server-side DOCX conversion path not available, returns original SFDT with headers:
    //      X-Export-Status: disabled, X-Export-Reason: diagnostic token list
    //    Frontend uses capabilities endpoint + these headers to present client fallback (raw SFDT download).
    //  * On conversion exceptions, returns SFDT with X-Export-Status: fallback (non-fatal to UX).
    //  * Successful conversions set X-Export-Status: success.
    [HttpPost("Export")]
    public IActionResult Export([FromBody] ExportRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Format) || string.IsNullOrWhiteSpace(request.Data))
        {
            return BadRequest(new { error = "Invalid request" });
        }

        var format = request.Format.Trim().ToLowerInvariant();
        var fileName = request.FileName ?? "document";
        var sfdtLength = request.Data.Length;
        var sw = Stopwatch.StartNew();
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["ExportFormat"] = format,
            ["FileName"] = fileName,
            ["SfdtLength"] = sfdtLength
        });
        _logger.LogInformation("Export request received: format={Format} fileName={FileName} sfdtLength={Length}", format, fileName, sfdtLength);

        if (format == "sfdt")
        {
            return new FileContentResult(Encoding.UTF8.GetBytes(request.Data), "application/json") { FileDownloadName = fileName + ".sfdt" };
        }
        if (format == "docx" || format == "pdf")
        {
            try
            {
                var docxBytes = TryConvertSfdtToDocxBytes(request.Data, out var convInfo);
                if (docxBytes == null)
                {
                    Response.Headers["X-Export-Status"] = "disabled";
                    if (!string.IsNullOrEmpty(convInfo)) Response.Headers["X-Export-Reason"] = convInfo;
                    // Return original SFDT cleanly so client can message user about missing server capability.
                    _logger.LogWarning("Server conversion disabled; returning SFDT fallback. Diagnostic={Diagnostic}", convInfo);
                    return new FileContentResult(Encoding.UTF8.GetBytes(request.Data), "application/json") { FileDownloadName = fileName + ".sfdt" };
                }

                if (format == "docx")
                {
                    Response.Headers["X-Export-Status"] = "success";
                    _logger.LogInformation("DOCX export success bytes={Bytes} elapsedMs={Ms}", docxBytes.Length, sw.ElapsedMilliseconds);
                    return new FileContentResult(docxBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document") { FileDownloadName = fileName + ".docx" };
                }

                // PDF conversion via DocIO + DocIORenderer
                using var loadStream = new MemoryStream(docxBytes);
                using var docIO = new DocIOWordDocument(loadStream, DocIOFormatType.Docx);
                using var renderer = new DocIORenderer();
                using var pdfDoc = renderer.ConvertToPDF(docIO);
                using var pdfStream = new MemoryStream();
                pdfDoc.Save(pdfStream);
                pdfDoc.Close(true);
                var pdfBytes = pdfStream.ToArray();
                Response.Headers["X-Export-Status"] = "success";
                _logger.LogInformation("PDF export success bytes={Bytes} elapsedMs={Ms}", pdfBytes.Length, sw.ElapsedMilliseconds);
                return new FileContentResult(pdfBytes, "application/pdf") { FileDownloadName = fileName + ".pdf" };
            }
            catch (Exception ex)
            {
                // Graceful fallback: return original SFDT (not an outright 500) so client can decide.
                Response.Headers["X-Export-Status"] = "fallback";
                Response.Headers["X-Export-Error"] = ex.GetType().Name;
                Response.Headers["X-Export-Fallback"] = "sfdt";
                // Provide minimal diagnostic while still returning a file payload.
                _logger.LogError(ex, "Export failed; returning SFDT fallback. Elapsed={Ms}ms", sw.ElapsedMilliseconds);
                var bytes = Encoding.UTF8.GetBytes(request.Data);
                var fallbackName = fileName + ".sfdt";
                return new FileContentResult(bytes, "application/json") { FileDownloadName = fallbackName };
            }
        }
        return BadRequest(new { error = "Unsupported format" });
    }

    // Capability probing without performing expensive conversions.
    // GET /api/documenteditor/Capabilities
    [HttpGet("Capabilities")]
    public IActionResult Capabilities()
    {
        // Use a minimal SFDT skeleton to invoke the same probe logic.
        var sample = "{\"sections\":[{\"blocks\":[{\"inlines\":[{\"text\":\"x\"}]}]}]}";
        var bytes = TryConvertSfdtToDocxBytes(sample, out var diag);
        var docxEnabled = bytes != null;
        var pdfEnabled = docxEnabled; // PDF depends on DOCX generation in current design.
        _logger.LogInformation("Capabilities probe: docx={Docx} pdf={Pdf} diagLength={DiagLen}", docxEnabled, pdfEnabled, diag?.Length ?? 0);
        return Ok(new
        {
            docxConversion = docxEnabled,
            pdfConversion = pdfEnabled,
            diagnostic = diag,
            status = docxEnabled ? "ready" : "disabled"
        });
    }
}

public class ExportRequest
{
    public string? Format { get; set; }
    public string? Data { get; set; }
    public string? FileName { get; set; }
}

// Internal helper utilities (could be moved to a service later)
partial class DocumentEditorController
{
    /// <summary>
    /// Attempts to convert SFDT -> DOCX. Strategy:
    /// 1. Try direct strongly-typed API path (if supported in this Syncfusion build).
    /// 2. Fall back to reflection-based probing of LoadString/Save overloads to keep binary-only changes from breaking runtime.
    /// 3. Returns null (capability disabled) instead of throwing so upstream can gracefully degrade.
    /// Returns null when no viable path is found (capability disabled) so caller can surface a graceful fallback.
    /// </summary>
    private byte[]? TryConvertSfdtToDocxBytes(string sfdt, out string diagnostic)
    {
        // Attempt direct path first (wrapped in try to avoid throwing on unsupported enum values in certain versions)
        try
        {
            // Some versions expose EJ2 WordDocument.LoadString(string, FormatType) with a FormatType that includes Sfdt / Docx
            var directDoc = EJ2WordDocument.LoadString(sfdt, EJ2FormatType.Sfdt);
            try
            {
                using var msDirect = new MemoryStream();
                directDoc.Save(msDirect, EJ2FormatType.Docx);
                diagnostic = "direct-success";
                return msDirect.ToArray();
            }
            finally { directDoc?.Dispose(); }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Direct conversion path unavailable; falling back to reflection.");
        }

        diagnostic = string.Empty;
        var ej2Type = typeof(EJ2WordDocument);
        object? ej2Instance = null;
        try
        {
            var methods = ej2Type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Instance)
                .Select(m => m.Name + "(" + string.Join(',', m.GetParameters().Select(p => p.ParameterType.Name)) + ")")
                .Take(40);
            diagnostic = "methods:" + string.Join('|', methods);

            var loadString = ej2Type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
                .FirstOrDefault(m => m.Name == "LoadString" && m.GetParameters().Length == 1 && m.GetParameters()[0].ParameterType == typeof(string))
                ?? ej2Type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
                    .FirstOrDefault(m => m.Name == "LoadString" && m.GetParameters().Length == 2);

            if (loadString == null)
            {
                diagnostic += ";no-loadstring";
                return null;
            }

            ej2Instance = loadString.GetParameters().Length == 1
                ? loadString.Invoke(null, new object[] { sfdt })
                : loadString.Invoke(null, new object[] { sfdt, Enum.Parse(loadString.GetParameters()[1].ParameterType, "Sfdt", true) });

            if (ej2Instance == null)
            {
                diagnostic += ";load-null";
                return null;
            }

            var ms = new MemoryStream();
            var saveMethod = ej2Type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
                .FirstOrDefault(m => m.Name == "Save" && m.GetParameters().Length == 2 && typeof(Stream).IsAssignableFrom(m.GetParameters()[0].ParameterType));

            if (saveMethod != null)
            {
                var formatParam = saveMethod.GetParameters()[1].ParameterType;
                object formatValue;
                try { formatValue = Enum.Parse(formatParam, "Docx", true); }
                catch { formatValue = Enum.GetValues(formatParam).Cast<object>().First(); }
                saveMethod.Invoke(ej2Instance, new object[] { ms, formatValue });
                return ms.ToArray();
            }

            var saveFileMethod = ej2Type.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
                .FirstOrDefault(m => m.Name == "Save" && m.GetParameters().Length == 2 && m.GetParameters()[0].ParameterType == typeof(string));
            if (saveFileMethod != null)
            {
                var temp = Path.GetTempFileName() + ".docx";
                var formatParam = saveFileMethod.GetParameters()[1].ParameterType;
                object formatValue;
                try { formatValue = Enum.Parse(formatParam, "Docx", true); }
                catch { formatValue = Enum.GetValues(formatParam).Cast<object>().First(); }
                saveFileMethod.Invoke(ej2Instance, new object[] { temp, formatValue });
                var bytes = System.IO.File.ReadAllBytes(temp);
                try { System.IO.File.Delete(temp); } catch { }
                return bytes;
            }
            diagnostic += ";no-save-overload";
            return null;
        }
        catch (Exception ex)
        {
            diagnostic += ";reflection-ex:" + ex.GetType().Name;
            _logger.LogDebug(ex, "Reflection conversion path failed.");
            return null;
        }
        finally
        {
            if (ej2Instance is IDisposable disp) disp.Dispose();
        }
    }
}