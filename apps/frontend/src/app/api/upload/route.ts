import { NextResponse } from "next/server";

import {
  generateTurbo,
  uploadFileToArweaveUsingTurbo2,
  createJSONFile, deleteJSONFile, writeFileToTempDir
} from "../../../lib/uploadFileToArweaveViaTurbo";


type Results = {
  transactionIds: string[];
  errors: { fileName: string, errorMessage: string | unknown }[];
};

type Project = {
  description: string;
  category: string;
  amount: string;
  date: string;
  title: string;
}


export async function POST(req: Request) {
    const formdata = await req.formData();
    const files = formdata.getAll("files") as File[];
    let project = formdata.get("projectDetails") as string;
    let details: Project = JSON.parse(project) as Project

    let results: Results = {
      transactionIds: [],
      errors: []
    };
    const turbo = await generateTurbo();
    // Upload each file
    for (const file of files) {
      try {
        //const arrayBuffer = await file.arrayBuffer();
        //const fileBuffer = Buffer.from(arrayBuffer);
        const filePath = await writeFileToTempDir(file);
        const tags = [{ name: "Content-Type", value: file.type }]
        const transID = await uploadFileToArweaveUsingTurbo2(turbo, filePath, tags)
        //const transID = await uploadData(fileBuffer, tags);
        console.log(`Transaction ${transID} uploaded`);
        deleteJSONFile(filePath);
        if (transID) {
          const combineIDnType = transID.concat(`:${file.type}`)
          results.transactionIds.push(combineIDnType);
        }

      } catch (error: any) {
        console.error(`Error uploading file in index ${file.name}:`, error);
      }
    }

    let projectData = {
      description: details.description,
      category: details.category,
      amount: details.amount || "",
      date: details.date || "",
      media: results.transactionIds,
      title: details.title
    }

    const filePath = createJSONFile(projectData)
    const tags = [{ name: "Content-Type", value: "application/json" }]
    try {
      const transID = await uploadFileToArweaveUsingTurbo2(turbo, filePath, tags);
      console.log("JSON File Uploaded", transID);
      deleteJSONFile(filePath);
      const response = NextResponse.json({
        success: true,
        data: transID
      }, {
        status: 200
      });

      console.log("Sending response:", response); // Debug log
      return response;

    } catch (error: any) {
      console.error(`Error when uploading details failed:`, error);
      const errorResponse = NextResponse.json({
        success: false,
        error: "uploading of project details failed"
      }, {
        status: 500
      });

      console.log("Sending error response:", errorResponse); // Debug log
      return errorResponse;
    }
    //res.status(200).json(transID);
  

}