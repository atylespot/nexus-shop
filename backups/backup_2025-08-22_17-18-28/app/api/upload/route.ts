import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    
    // Handle both single file and multiple files
    const files = form.getAll("files") as File[];
    const singleFile = form.get("file") as File;
    
    console.log('📤 Upload request received');
    console.log('🔍 Multiple files count:', files.length);
    console.log('🔍 Single file:', singleFile ? singleFile.name : 'null');
    
    let filesToProcess: File[] = [];
    
    if (files.length > 0) {
      // Multiple files upload
      filesToProcess = files;
      console.log('📁 Processing multiple files:', files.map(f => f.name));
    } else if (singleFile && singleFile instanceof File) {
      // Single file upload
      filesToProcess = [singleFile];
      console.log('📁 Processing single file:', singleFile.name);
    } else {
      console.log('❌ No files found in FormData');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of filesToProcess) {
      console.log(`📤 Processing file: ${file.name} (${file.size} bytes)`);
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const originalName = file.name || "upload";
      const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
      const filePath = path.join(uploadsDir, uniqueName);
      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${uniqueName}`;
      uploadedFiles.push({ url: publicUrl, name: uniqueName });
      
      console.log(`✅ File uploaded: ${publicUrl}`);
    }

    console.log(`🎉 Upload completed: ${uploadedFiles.length} files`);
    
    // Return single object for single file, array for multiple files
    if (filesToProcess.length === 1) {
      return NextResponse.json(uploadedFiles[0]);
    } else {
      return NextResponse.json(uploadedFiles);
    }
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


