import { simulateRequest } from "./utils";

export const createProjectRequest = async (payload) => simulateRequest(payload);
export const updateProjectRequest = async (payload) => simulateRequest(payload);
export const deleteProjectRequest = async () => simulateRequest(true);
export const joinProjectRequest = async () => simulateRequest(true);
export const leaveProjectRequest = async () => simulateRequest(true);
export const sendRequestToLeader = async () => simulateRequest(true);
export const respondToRequest = async () => simulateRequest(true);
