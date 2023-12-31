import { connectToDB } from "@/lib/config/mongoose";
import File from "@/lib/model/file.model";

export async function GET(request:Request,{ params }: { params: { org: string, fileId:string } }){
  connectToDB();

  const foundFile = await File.findOne({ proxyURL: params.fileId });

  // verify user here.

  if (foundFile) {
    try {
      // Fetch the actual file from the original URL
      const response = await fetch(foundFile.url);

      // Set the appropriate response headers

      const headers = new Headers({
        "Content-Type": foundFile.mimeType,
        "Content-Disposition": `inline; filename="${foundFile.originalFilename}"`, // Set to 'inline'
      });

      // Serve the file to the client by piping the response stream
      return new Response(response.body, { status: 200, headers });
    } catch (error) {
      console.error("Error fetching file:", error);
      return new Response("Error fetching file", { status: 500 });
    }
  } else {
    return new Response("File not found", { status: 404 });
  }
};
