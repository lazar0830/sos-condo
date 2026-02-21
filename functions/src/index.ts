import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// ============================================
// Email Configuration
// ============================================
// Configure your SMTP settings using Firebase environment config:
// firebase functions:config:set email.host="smtp.gmail.com" email.port="587" email.user="your-email@gmail.com" email.pass="your-app-password" email.from="S.O.S. Condo <noreply@soscondo.com>"

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

const getEmailConfig = (): EmailConfig => {
  const config = functions.config().email || {};
  return {
    host: config.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(config.port || process.env.EMAIL_PORT || '587', 10),
    secure: (config.secure || process.env.EMAIL_SECURE) === 'true',
    user: config.user || process.env.EMAIL_USER || '',
    pass: config.pass || process.env.EMAIL_PASS || '',
    from: config.from || process.env.EMAIL_FROM || 'S.O.S. Condo <noreply@soscondo.com>',
  };
};

const createTransporter = () => {
  const config = getEmailConfig();
  
  if (!config.user || !config.pass) {
    console.warn('Email credentials not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

// ============================================
// Send Service Request Email
// ============================================
// This function triggers when a new service request is created
// and sends the generated email to the service provider

export const onServiceRequestCreated = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const requestData = snapshot.data();
    const requestId = context.params.requestId;

    console.log(`New service request created: ${requestId}`);

    // Check if there's generated email content
    if (!requestData.generatedEmail) {
      console.log('No generated email content found. Skipping email send.');
      return null;
    }

    // Get the service provider's email
    const providerId = requestData.providerId;
    if (!providerId) {
      console.log('No provider ID found. Skipping email send.');
      return null;
    }

    const db = admin.firestore();
    
    try {
      // Get the service provider document
      const providerDoc = await db.collection('providers').doc(providerId).get();
      if (!providerDoc.exists) {
        console.error(`Service provider not found: ${providerId}`);
        return null;
      }

      const providerData = providerDoc.data();
      const providerEmail = providerData?.email;
      // const providerName = providerData?.name || 'Service Provider';

      if (!providerEmail) {
        console.error(`No email found for provider: ${providerId}`);
        return null;
      }

      // Create the email transporter
      const transporter = createTransporter();
      if (!transporter) {
        console.error('Email transporter not configured. Email not sent.');
        // Update the service request to indicate email was not sent
        await snapshot.ref.update({
          emailSent: false,
          emailError: 'Email service not configured',
        });
        return null;
      }

      const config = getEmailConfig();

      // Parse the generated email to extract subject and body
      const emailContent = requestData.generatedEmail;
      let subject = 'S.O.S. Condo - Demande de service - Service Request';
      let body = emailContent;

      // Try to extract subject from the email content if it starts with "Subject:"
      const subjectMatch = emailContent.match(/^Subject:\s*(.+?)(\n|$)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        body = emailContent.substring(subjectMatch[0].length).trim();
      }

      // Send the email
      const mailOptions = {
        from: config.from,
        to: providerEmail,
        subject: subject,
        text: body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">S.O.S. Condo</h1>
              <p style="margin: 5px 0 0 0;">Demande de service - Service Request</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
              <div style="white-space: pre-wrap; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>
            </div>
            <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">Veuillez vous connecter pour accepter ou refuser la demande de service. Merci.<br>Please Login to Accept or Decline the Service Request. Thank you.</p>
              <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
            </div>
            <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Ceci est un message automatique de S.O.S Condo. Veuillez ne pas répondre directement à ce courriel.</p>
              <p style="margin: 5px 0 0 0;">This is an automated message from S.O.S. Condo. Please do not reply directly to this email.</p>
            </div>
          </div>
        `,
      };

      console.log('Update email tempalte')
      console.log(`Sending email to: ${providerEmail}`);
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully. Message ID: ${info.messageId}`);

      // Update the service request to indicate email was sent
      await snapshot.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailMessageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update the service request with the error
      await snapshot.ref.update({
        emailSent: false,
        emailError: error instanceof Error ? error.message : 'Unknown error',
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

// ============================================
// Send Email to Property Manager on Status Change
// ============================================
// This function triggers when a service request is updated
// and sends an email notification to the Property Manager if the status changed

export const onServiceRequestUpdated = functions.firestore
  .document('requests/{requestId}')
  .onUpdate(async (change: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const requestId = context.params.requestId;

    // Check if status changed
    const beforeStatus = beforeData.status;
    const afterStatus = afterData.status;

    if (beforeStatus === afterStatus) {
      console.log(`Service request ${requestId} updated but status unchanged. Skipping email.`);
      return null;
    }

    console.log(`Service request ${requestId} status changed from ${beforeStatus} to ${afterStatus}`);

    const db = admin.firestore();

    try {
      // Get the task associated with this request
      const taskId = afterData.taskId;
      if (!taskId) {
        console.error(`No taskId found for request ${requestId}`);
        return null;
      }

      const taskDoc = await db.collection('tasks').doc(taskId).get();
      if (!taskDoc.exists) {
        console.error(`Task not found: ${taskId}`);
        return null;
      }

      const taskData = taskDoc.data();
      const buildingId = taskData?.buildingId;
      if (!buildingId) {
        console.error(`No buildingId found for task ${taskId}`);
        return null;
      }

      // Get the building to find the Property Manager
      const buildingDoc = await db.collection('buildings').doc(buildingId).get();
      if (!buildingDoc.exists) {
        console.error(`Building not found: ${buildingId}`);
        return null;
      }

      const buildingData = buildingDoc.data();
      const propertyManagerId = buildingData?.createdBy;
      if (!propertyManagerId) {
        console.error(`No Property Manager (createdBy) found for building ${buildingId}`);
        return null;
      }

      // Get the Property Manager user
      const managerDoc = await db.collection('users').doc(propertyManagerId).get();
      if (!managerDoc.exists) {
        console.error(`Property Manager user not found: ${propertyManagerId}`);
        return null;
      }

      const managerData = managerDoc.data();
      const managerEmail = managerData?.email;
      const managerName = managerData?.username || 'Property Manager';

      if (!managerEmail) {
        console.error(`No email found for Property Manager: ${propertyManagerId}`);
        return null;
      }

      // Create the email transporter
      const transporter = createTransporter();
      if (!transporter) {
        console.error('Email transporter not configured. Email not sent.');
        return null;
      }

      const config = getEmailConfig();

      // Get additional details for the email
      const taskName = taskData?.name || 'Maintenance Task';
      const buildingName = buildingData?.name || 'Property';
      const buildingAddress = buildingData?.address || '';
      
      // Get provider name safely
      let providerName = 'Service Provider';
      if (afterData.providerId) {
        try {
          const providerDoc = await db.collection('providers').doc(afterData.providerId).get();
          if (providerDoc.exists) {
            providerName = providerDoc.data()?.name || 'Service Provider';
          }
        } catch (error) {
          console.warn(`Could not fetch provider name for ${afterData.providerId}:`, error);
        }
      }
      const scheduledDate = afterData.scheduledDate || 'Not scheduled';
      const estimatedCost = afterData.cost ? `$${afterData.cost.toFixed(2)}` : 'Not specified';
      
      // Get who changed the status from statusHistory
      let changedBy = 'System';
      if (afterData.statusHistory && Array.isArray(afterData.statusHistory) && afterData.statusHistory.length > 0) {
        const lastStatusChange = afterData.statusHistory[afterData.statusHistory.length - 1];
        if (lastStatusChange && lastStatusChange.changedBy) {
          changedBy = lastStatusChange.changedBy;
        }
      }

      // Create email content
      const statusLabels: { [key: string]: string } = {
        'Sent': 'Sent',
        'Accepted': 'Accepted',
        'Refused': 'Refused',
        'In Progress': 'In Progress',
        'Completed': 'Completed',
      };

      const newStatusLabel = statusLabels[afterStatus] || afterStatus;
      const oldStatusLabel = statusLabels[beforeStatus] || beforeStatus;

      const subject = `S.O.S. Condo - Service Request Status Updated: ${newStatusLabel}`;
      
      const textBody = `
        Service Request Status Update

        Dear ${managerName},

        The status of a service request has been updated.

        Request Details:
        - Task: ${taskName}
        - Property: ${buildingName}
        - Address: ${buildingAddress}
        - Service Provider: ${providerName}
        - Scheduled Date: ${scheduledDate}
        - Estimated Cost: ${estimatedCost}

        Status Change:
        - Previous Status: ${oldStatusLabel}
        - New Status: ${newStatusLabel}
        - Changed By: ${changedBy}
        - Changed At: ${new Date().toLocaleString()}

        Please log in to view the full details of this service request.

        Best regards,
        S.O.S. Condo System
      `.trim();

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">S.O.S. Condo</h1>
            <p style="margin: 5px 0 0 0;">Service Request Status Update</p>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">Dear ${managerName},</p>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151;">The status of a service request has been updated.</p>
            
            <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #374151; width: 140px;">Task:</td>
                  <td style="padding: 6px 0; color: #6b7280;">${taskName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #374151;">Property:</td>
                  <td style="padding: 6px 0; color: #6b7280;">${buildingName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #374151;">Address:</td>
                  <td style="padding: 6px 0; color: #6b7280;">${buildingAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #374151;">Service Provider:</td>
                  <td style="padding: 6px 0; color: #6b7280;">${providerName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #374151;">Scheduled Date:</td>
                  <td style="padding: 6px 0; color: #6b7280;">${scheduledDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #374151;">Estimated Cost:</td>
                  <td style="padding: 6px 0; color: #6b7280;">${estimatedCost}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #eff6ff; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb; margin-bottom: 16px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">Status Change:</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #374151;">
                <strong>Previous Status:</strong> <span style="color: #6b7280;">${oldStatusLabel}</span><br>
                <strong>New Status:</strong> <span style="color: #2563eb; font-weight: 600;">${newStatusLabel}</span><br>
                <strong>Changed By:</strong> <span style="color: #6b7280;">${changedBy}</span><br>
                <strong>Changed At:</strong> <span style="color: #6b7280;">${new Date().toLocaleString()}</span>
              </p>
            </div>
          </div>
          
          <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">Please log in to view the full details of this service request.</p>
            <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
          </div>
          <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Ceci est un message automatique de S.O.S Condo. Veuillez ne pas répondre directement à ce courriel.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message from S.O.S. Condo. Please do not reply directly to this email.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: config.from,
        to: managerEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      };

      console.log(`Sending status update email to Property Manager: ${managerEmail}`);
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`Status update email sent successfully. Message ID: ${info.messageId}`);

      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('Error sending status update email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

// ============================================
// Scheduled Task Reminder Email to Property Managers
// ============================================
// This function runs daily and sends Property Managers an email
// listing tasks that are due in the next 30 days and need Service Requests

export const sendTaskReminderEmails = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/Montreal')
  .onRun(async (context) => {
    console.log('Running scheduled task reminder email job');

    const db = admin.firestore();
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    try {
      // Get all tasks
      const tasksSnapshot = await db.collection('tasks').get();
      const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Get all service requests to check which tasks already have requests
      const requestsSnapshot = await db.collection('requests').get();
      const taskIdsWithRequests = new Set(
        requestsSnapshot.docs.map(doc => doc.data().taskId).filter(Boolean)
      );

      // Filter tasks that:
      // 1. Are due within the next 30 days
      // 2. Have status "New" (not yet sent)
      // 3. Don't already have a Service Request
      // 4. Are not master recurring tasks (only one-time instances)
      const tasksNeedingRequests = allTasks.filter((task: any) => {
        // Skip master recurring tasks (they don't have taskDate)
        if (task.recurrence && task.recurrence !== 'One-Time' && !task.taskDate) {
          return false;
        }

        // Must have status "New"
        if (task.status !== 'New') {
          return false;
        }

        // Must not already have a Service Request
        if (taskIdsWithRequests.has(task.id)) {
          return false;
        }

        // Check if task is due within next 30 days
        const taskDate = task.taskDate || task.startDate;
        if (!taskDate) {
          return false;
        }

        const taskDateObj = new Date(taskDate + 'T12:00:00Z');
        return taskDateObj >= today && taskDateObj <= thirtyDaysFromNow;
      });

      if (tasksNeedingRequests.length === 0) {
        console.log('No tasks need Service Requests in the next 30 days.');
        return null;
      }

      console.log(`Found ${tasksNeedingRequests.length} tasks needing Service Requests`);

      // Get all buildings and users
      const buildingsSnapshot = await db.collection('buildings').get();
      const buildings = new Map<string, { id: string; name?: string; address?: string; createdBy?: string; [key: string]: any }>(
        buildingsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])
      );

      const usersSnapshot = await db.collection('users').get();
      const users = new Map<string, { id: string; email?: string; username?: string; role?: string; [key: string]: any }>(
        usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }])
      );

      // Group tasks by Property Manager
      interface TaskWithBuilding {
        task: { id: string; name?: string; description?: string; taskDate?: string; startDate?: string; specialty?: string; [key: string]: any };
        building: { id: string; name?: string; createdBy?: string; [key: string]: any };
      }
      const tasksByManager = new Map<string, TaskWithBuilding[]>();

      for (const task of tasksNeedingRequests) {
        const building = buildings.get(task.buildingId);
        if (!building || !building.createdBy) {
          console.warn(`Task ${task.id} has no building or Property Manager`);
          continue;
        }

        const propertyManagerId = building.createdBy;
        if (!propertyManagerId) {
          console.warn(`Building ${building.id} has no Property Manager`);
          continue;
        }
        
        if (!tasksByManager.has(propertyManagerId)) {
          tasksByManager.set(propertyManagerId, []);
        }
        tasksByManager.get(propertyManagerId)!.push({
          task,
          building,
        });
      }

      // Send email to each Property Manager
      const transporter = createTransporter();
      if (!transporter) {
        console.error('Email transporter not configured. Emails not sent.');
        return null;
      }

      const config = getEmailConfig();
      let emailsSent = 0;

      for (const [managerId, taskList] of tasksByManager.entries()) {
        const manager = users.get(managerId);
        if (!manager || !manager.email) {
          console.warn(`Property Manager ${managerId} not found or has no email`);
          continue;
        }

        // Only send to Property Managers
        if (manager.role !== 'Property Manager') {
          continue;
        }

        const managerEmail = manager.email!;
        const managerName = manager.username || 'Property Manager';

        // Sort tasks by date
        taskList.sort((a, b) => {
          const dateA = a.task.taskDate || a.task.startDate || '';
          const dateB = b.task.taskDate || b.task.startDate || '';
          return dateA.localeCompare(dateB);
        });

        // Create email content
        const subject = `S.O.S. Condo - ${taskList.length} Task${taskList.length > 1 ? 's' : ''} Need Service Request${taskList.length > 1 ? 's' : ''}`;

        const taskListHtml = taskList.map(({ task, building }) => {
          const taskDate = task.taskDate || task.startDate || 'Not specified';
          const formattedDate = new Date(taskDate + 'T12:00:00Z').toLocaleDateString();
          const daysUntilDue = Math.ceil(
            (new Date(taskDate + 'T12:00:00Z').getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; vertical-align: top;">
                <strong style="color: #111827; font-size: 14px;">${task.name || 'Unnamed Task'}</strong>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${task.description || 'No description'}</p>
                <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                  <span style="display: inline-block; margin-right: 12px;"><strong>Property:</strong> ${building.name || 'Unknown'}</span>
                  <span style="display: inline-block; margin-right: 12px;"><strong>Due Date:</strong> ${formattedDate} (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''})</span>
                  ${task.specialty ? `<span style="display: inline-block;"><strong>Specialty:</strong> ${task.specialty}</span>` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('');

        const textBody = `
Task Reminder - Service Requests Needed

Dear ${managerName},

You have ${taskList.length} task${taskList.length > 1 ? 's' : ''} that ${taskList.length > 1 ? 'are' : 'is'} due in the next 30 days and ${taskList.length > 1 ? 'need' : 'needs'} a Service Request to be created.

${taskList.map(({ task, building }) => {
  const taskDate = task.taskDate || task.startDate || 'Not specified';
  const formattedDate = new Date(taskDate + 'T12:00:00Z').toLocaleDateString();
  const daysUntilDue = Math.ceil(
    (new Date(taskDate + 'T12:00:00Z').getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `- ${task.name || 'Unnamed Task'} (${building.name || 'Unknown'}) - Due: ${formattedDate} (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''})`;
}).join('\n')}

Please log in to create Service Requests for these tasks.

Best regards,
S.O.S. Condo System
        `.trim();

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">S.O.S. Condo</h1>
              <p style="margin: 5px 0 0 0;">Task Reminder - Service Requests Needed</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">Dear ${managerName},</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #374151;">
                You have <strong>${taskList.length} task${taskList.length > 1 ? 's' : ''}</strong> that ${taskList.length > 1 ? 'are' : 'is'} due in the next 30 days and ${taskList.length > 1 ? 'need' : 'needs'} a Service Request to be created.
              </p>
              
              <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">Tasks Requiring Service Requests:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${taskListHtml}
                </table>
              </div>
            </div>
            
            <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">Please log in to create Service Requests for these tasks.</p>
              <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login to Create Service Requests</a>
            </div>
            <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Ceci est un message automatique de S.O.S Condo. Veuillez ne pas répondre directement à ce courriel.</p>
              <p style="margin: 5px 0 0 0;">This is an automated message from S.O.S. Condo. Please do not reply directly to this email.</p>
            </div>
          </div>
        `;

        const mailOptions = {
          from: config.from,
          to: managerEmail,
          subject: subject,
          text: textBody,
          html: htmlBody,
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log(`Task reminder email sent to ${managerEmail}. Message ID: ${info.messageId}`);
          emailsSent++;
        } catch (error) {
          console.error(`Error sending email to ${managerEmail}:`, error);
        }
      }

      console.log(`Task reminder job completed. ${emailsSent} email${emailsSent !== 1 ? 's' : ''} sent.`);
      return { success: true, emailsSent, tasksFound: tasksNeedingRequests.length };

    } catch (error) {
      console.error('Error in task reminder job:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

// ============================================
// Manual Send Email Function (callable)
// ============================================
// This function can be called to manually resend an email for a service request

interface SendEmailRequest {
  requestId: string;
}

export const sendServiceRequestEmail = functions.https.onCall(async (data: SendEmailRequest, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const { requestId } = data;
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.');
  }

  const db = admin.firestore();

  // Get the service request
  const requestDoc = await db.collection('requests').doc(requestId).get();
  if (!requestDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Service request not found.');
  }

  const requestData = requestDoc.data();
  if (!requestData?.generatedEmail) {
    throw new functions.https.HttpsError('failed-precondition', 'No generated email content found.');
  }

  // Get the service provider
  const providerDoc = await db.collection('providers').doc(requestData.providerId).get();
  if (!providerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Service provider not found.');
  }

  const providerData = providerDoc.data();
  const providerEmail = providerData?.email;

  if (!providerEmail) {
    throw new functions.https.HttpsError('failed-precondition', 'Provider has no email address.');
  }

  // Create the email transporter
  const transporter = createTransporter();
  if (!transporter) {
    throw new functions.https.HttpsError('failed-precondition', 'Email service not configured.');
  }

  const config = getEmailConfig();

  // Parse the generated email
  const emailContent = requestData.generatedEmail;
  let subject = 'New Service Request from S.O.S. Condo';
  let body = emailContent;

  const subjectMatch = emailContent.match(/^Subject:\s*(.+?)(\n|$)/i);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    body = emailContent.substring(subjectMatch[0].length).trim();
  }

  try {
    const mailOptions = {
      from: config.from,
      to: providerEmail,
      subject: subject,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">S.O.S. Condo</h1>
            <p style="margin: 5px 0 0 0;">Service Request Notification</p>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">Veuillez vous connecter pour accepter ou refuser la demande de service. Merci.<br>Please Login to Accept or Decline the Service Request. Thank you.</p>
            <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
          </div>
          <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This is an automated message from S.O.S. Condo Property Management System.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    // Update the service request
    await requestDoc.ref.update({
      emailSent: true,
      emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      emailMessageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Failed to send email');
  }
});

// ============================================
// Create User Function
// ============================================

interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
  role: 'Admin' | 'Property Manager' | 'Service Provider';
  createdBy: string;
}

export const createUser = functions.https.onCall(async (data: CreateUserRequest, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const callerUid = context.auth.uid;
  const db = admin.firestore();

  // Verify caller is Super Admin, Admin, or Property Manager
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
  }
  const callerRole = callerDoc.data()?.role;
  const canCreateUsers = callerRole === 'Super Admin' || callerRole === 'Admin' || callerRole === 'Property Manager';
  if (!canCreateUsers) {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admin, Admin, or Property Manager can create users.');
  }

  // Super Admin: Admin, Property Manager, Service Provider
  // Admin: Property Manager, Service Provider
  // Property Manager: Service Provider only
  const { email, password, username, role, createdBy } = data;
  if (!email || !password || !username || !role || !createdBy) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }
  if (role === 'Admin' && callerRole !== 'Super Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only Super Admin can create Admins.');
  }
  if (role === 'Property Manager' && callerRole === 'Property Manager') {
    throw new functions.https.HttpsError('permission-denied', 'Property Managers cannot create other Property Managers.');
  }

  const auth = admin.auth();
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new functions.https.HttpsError('invalid-argument', msg);
  }

  const userProfile = {
    email,
    username,
    role,
    createdBy,
  };
  await db.collection('users').doc(userRecord.uid).set(userProfile);

  return { uid: userRecord.uid };
});

// ============================================
// Change User Password Function
// ============================================

interface ChangePasswordRequest {
  userId: string;
  newPassword: string;
}

export const changeUserPassword = functions.https.onCall(async (data: ChangePasswordRequest, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const callerUid = context.auth.uid;
  const db = admin.firestore();

  const { userId, newPassword } = data;
  if (!userId || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID and new password are required.');
  }

  // Validate password length (Firebase requires at least 6 characters)
  if (newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long.');
  }

  const isChangingOwnPassword = userId === callerUid;

  if (!isChangingOwnPassword) {
    // Changing another user's password: caller must be Super Admin or Admin
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
    }
    const callerRole = callerDoc.data()?.role;
    const canChangeOthers = callerRole === 'Super Admin' || callerRole === 'Admin';
    if (!canChangeOthers) {
      throw new functions.https.HttpsError('permission-denied', 'Only Super Admin or Admin can change other users\' passwords.');
    }

    const targetUserDoc = await db.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    const targetUserRole = targetUserDoc.data()?.role;
    if (callerRole === 'Admin') {
      if (targetUserRole === 'Super Admin' || targetUserRole === 'Admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admins cannot change passwords for Super Admins or other Admins.');
      }
    }
  } else {
    // Changing own password: verify caller has a user document
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
    }
  }

  try {
    // Update the password using Firebase Admin SDK
    await admin.auth().updateUser(userId, {
      password: newPassword,
    });

    console.log(`Password changed for user ${userId} by ${callerUid}`);
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Failed to change password');
  }
});
