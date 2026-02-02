import { GoogleGenAI } from "@google/genai";
import type { Building, MaintenanceTask } from '../types';

// The singleton instance, wrapped in an object to be mutable across modules.
export const gemini: { instance: GoogleGenAI | null } = {
  instance: null,
};

// Function to initialize the client.
export const initGemini = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    gemini.instance = new GoogleGenAI({ apiKey });
    return true;
  }
  console.error("Gemini API Key is missing. Please set the API_KEY environment variable.");
  return false;
};


export async function generateServiceRequestEmail(
  building: Building,
  task: MaintenanceTask,
  serviceProviderName: string,
  notes: string,
  scheduledDate?: string,
): Promise<string> {
  // This check is a safeguard. App.tsx should prevent this function from being called
  // if the API key is missing by rendering the SecretsSetupGuide component.
  if (!gemini.instance) {
    const errorMessage = "Error: Gemini AI client is not initialized. Please configure your API_KEY.";
    console.error(errorMessage);
    return errorMessage;
  }

  const prompt = `
    Generate a professional service request email for a property management company.

    **Instructions:**
    - The tone should be polite, clear, and professional.
    - Start with a clear subject line.
    - Address the service provider by their name.
    - Mention the property name and address.
    - Clearly state the maintenance task required, including its description.
    ${task.unitNumber ? `- The task is for Unit: ${task.unitNumber}` : ''}
    ${task.componentName ? `- The task relates to the following component: ${task.componentName}` : ''}
    ${scheduledDate ? '- State the scheduled date for the service.' : ''}
    - Include the additional notes provided.
    - End with a call to action, asking them to confirm receipt and schedule the work.
    - Sign off as "The Property Management Team".

    **Details to use:**
    - Service Provider Name: ${serviceProviderName}
    - Building Name: ${building.name}
    - Building Address: ${building.address}
    - Task Name: ${task.name}
    - Task Description: ${task.description}
    ${task.unitNumber ? `- Unit: ${task.unitNumber}` : ''}
    ${task.componentName ? `- Component: ${task.componentName}` : ''}
    ${scheduledDate ? `- Scheduled Date: ${new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
    - Additional Notes: ${notes || 'N/A'}

    Generate only the email content (Subject line and body). Do not add any extra explanations or text before or after the email.
  `;

  try {
    const response = await gemini.instance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating email with Gemini:", error);
    return "Error: Could not generate email content. Please try again.";
  }
}

export async function generateTurnoverChecklist(unitNumber: string, propertyType: string, activityType: string): Promise<string> {
  if (!gemini.instance) {
    const errorMessage = "Error: Gemini AI client is not initialized. Please configure your API_KEY.";
    console.error(errorMessage);
    return errorMessage;
  }

  const prompt = `
    You are an expert property manager. Your task is to generate a comprehensive unit checklist for a rental property. The checklist should be well-organized, detailed, and formatted in Markdown.

    **Instructions:**
    - Use the provided details to customize the checklist.
    - The tone should be professional and thorough.
    - Structure the checklist into logical sections appropriate for the activity.
    - For each item, provide a checkbox-like syntax (e.g., \`- [ ] Clean the oven inside and out.\`).
    - Be specific. For a "Luxury Apartment", you might add items like "Check wine fridge". For a "Painting" activity, focus only on painting-related prep and cleanup.

    **Details to use:**
    - Unit Number: ${unitNumber}
    - Property Type: ${propertyType}
    - Type of Activity: ${activityType}

    Generate only the Markdown checklist content. Do not add any extra explanations or text before or after the checklist. Start directly with a title like "# ${activityType} Checklist for Unit ${unitNumber}".
  `;

  try {
    const response = await gemini.instance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating checklist with Gemini:", error);
    return "Error: Could not generate checklist content. Please try again.";
  }
}