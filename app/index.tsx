import React from "react";
import ReportFlowPage from "../src/features/reportFlow/ReportFlowPage";
import { getAllActivities, getAllDetails } from "../src/services/dataService";
import { db } from "../src/services/db_local";

if (typeof window !== "undefined") {
  (window as any).getAllActivities = getAllActivities;
  (window as any).getAllDetails = getAllDetails;
  (window as any).db = db;
}

export default function IndexPage() {
  return <ReportFlowPage />;
}
