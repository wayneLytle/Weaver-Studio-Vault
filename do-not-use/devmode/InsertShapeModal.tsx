// Archival copy of InsertShapeModal (moved to do-not-use)
import React, { useState } from 'react';
import { useDev } from './store';
// Simple uuid generator using crypto.randomUUID (browser support required)
const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

// removed
export default function InsertShapeModal() { return null as any; }
