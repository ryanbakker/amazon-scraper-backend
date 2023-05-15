import * as functions from "firebase-functions";
import { adminDb } from "./firebaseAdmin";
// import * as admin from "firebase-admin";

const fetchResults: any = async (id: string) => {
  const api_key = process.env.BRIGHTDATA_API_KEY;

  const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${api_key}`,
    },
  });

  const data = await res.json();

  console.log("Debug One");

  if (data.status === "building" || data.status === "collecting") {
    console.log("NOT COMPLETE YET, TRYING AGAIN...");
    return fetchResults(id);
  }

  return data;
};

export const onScraperComplete = functions.https.onRequest(
  async (request, response) => {
    console.log("SCRAPE COMPLETE >>> : ", request.body);

    const { success, id, finished } = request.body;

    if (!success) {
      await adminDb.collection("searches").doc(id).set(
        {
          status: "error",
          updatedAt: finished,
        },
        {
          merge: true,
        }
      );
    }

    const data = await fetchResults(id);

    console.log("DEBUG 1");
    await adminDb.collection("searches").doc(id).set(
      {
        status: "complete",
        updatedAt: finished,
        results: data,
      },
      {
        merge: true,
      }
    );

    console.log("We did it lol");

    response.send("Scraping Function Completed");
  }
);

// https://5399-125-238-234-83.ngrok-free.app/brightdata-7b53f/us-central1/onScraperComplete
