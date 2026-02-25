"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserPassword = exports.createUser = exports.sendServiceRequestEmail = exports.sendTaskReminderEmailsNow = exports.sendTaskReminderEmails = exports.onServiceRequestUpdated = exports.onServiceRequestCreated = exports.SUPPORTED_EMAIL_LANGS = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const getEmailConfig = () => {
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
// Email copy by language (dynamic: add new keys to EMAIL_STRINGS to support more languages)
// ============================================
const DEFAULT_EMAIL_LANG = 'en';
const EMAIL_STRINGS = {
    en: {
        requestHeaderSubtitle: 'Service Request',
        requestLoginPrompt: 'Please log in to accept or decline the service request. Thank you.',
        requestFooter: 'This is an automated message from S.O.S. Condo. Please do not reply directly to this email.',
        statusUpdateSubject: 'S.O.S. Condo - Service Request Status Updated: {{newStatus}}',
        statusUpdateHeader: 'Service Request Status Update',
        statusUpdateDear: 'Dear {{name}},',
        statusUpdateIntro: 'The status of a service request has been updated.',
        statusUpdateRequestDetails: 'Request Details:',
        statusUpdateTask: 'Task:',
        statusUpdateProperty: 'Property:',
        statusUpdateAddress: 'Address:',
        statusUpdateServiceProvider: 'Service Provider:',
        statusUpdateScheduledDate: 'Scheduled Date:',
        statusUpdateEstimatedCost: 'Estimated Cost:',
        statusUpdateStatusChange: 'Status Change:',
        statusUpdatePreviousStatus: 'Previous Status:',
        statusUpdateNewStatus: 'New Status:',
        statusUpdateChangedBy: 'Changed By:',
        statusUpdateChangedAt: 'Changed At:',
        statusUpdateLoginPrompt: 'Please log in to view the full details of this service request.',
        statusUpdateRegards: 'Best regards, S.O.S. Condo System',
        statusUpdateFooter: 'This is an automated message from S.O.S. Condo. Please do not reply directly to this email.',
        reminderSubject: 'S.O.S. Condo - {{count}} Task Needs Service Request',
        reminderSubjectPlural: 'S.O.S. Condo - {{count}} Tasks Need Service Requests',
        reminderHeader: 'Task Reminder - Service Requests Needed',
        reminderDear: 'Dear {{name}},',
        reminderIntroOne: 'You have 1 task that is due in the next 30 days and needs a Service Request to be created.',
        reminderIntroMany: 'You have {{count}} tasks that are due in the next 30 days and need Service Requests to be created.',
        reminderTasksRequiring: 'Tasks Requiring Service Requests:',
        reminderProperty: 'Property:',
        reminderDueDate: 'Due Date:',
        reminderDays: 'day',
        reminderDaysPlural: 'days',
        reminderLoginPrompt: 'Please log in to create Service Requests for these tasks.',
        reminderRegards: 'Best regards, S.O.S. Condo System',
        reminderFooter: 'This is an automated message from S.O.S. Condo. Please do not reply directly to this email.',
        welcomeSubject: 'Welcome to S.O.S. Condo - Your Service Provider Account',
        welcomeHeader: 'Welcome to S.O.S. Condo',
        welcomeIntro: 'Your service provider account has been created. Use the credentials below to log in.',
        welcomeUsernameLabel: 'Username:',
        welcomePasswordLabel: 'Password:',
        welcomeLoginButton: 'Login',
        welcomeFooter: 'This is an automated message from S.O.S. Condo. Please do not reply directly to this email.',
        welcomePMSubject: 'Welcome to S.O.S. Condo - Your Property Manager Account',
        welcomePMHeader: 'Welcome to S.O.S. Condo',
        welcomePMIntro: 'Your property manager account has been created. Use the credentials below to log in.',
    },
    fr: {
        requestHeaderSubtitle: 'Demande de service',
        requestLoginPrompt: 'Veuillez vous connecter pour accepter ou refuser la demande de service. Merci.',
        requestFooter: 'Ceci est un message automatique de S.O.S. Condo. Veuillez ne pas répondre directement à ce courriel.',
        statusUpdateSubject: 'S.O.S. Condo - Mise à jour du statut de la demande : {{newStatus}}',
        statusUpdateHeader: 'Mise à jour du statut de la demande de service',
        statusUpdateDear: 'Bonjour {{name}},',
        statusUpdateIntro: 'Le statut d\'une demande de service a été mis à jour.',
        statusUpdateRequestDetails: 'Détails de la demande :',
        statusUpdateTask: 'Tâche :',
        statusUpdateProperty: 'Propriété :',
        statusUpdateAddress: 'Adresse :',
        statusUpdateServiceProvider: 'Fournisseur :',
        statusUpdateScheduledDate: 'Date prévue :',
        statusUpdateEstimatedCost: 'Coût estimé :',
        statusUpdateStatusChange: 'Changement de statut :',
        statusUpdatePreviousStatus: 'Ancien statut :',
        statusUpdateNewStatus: 'Nouveau statut :',
        statusUpdateChangedBy: 'Modifié par :',
        statusUpdateChangedAt: 'Modifié le :',
        statusUpdateLoginPrompt: 'Veuillez vous connecter pour voir les détails de cette demande.',
        statusUpdateRegards: 'Cordialement, S.O.S. Condo',
        statusUpdateFooter: 'Ceci est un message automatique de S.O.S. Condo. Veuillez ne pas répondre directement à ce courriel.',
        reminderSubject: 'S.O.S. Condo - {{count}} tâche requiert une demande de service',
        reminderSubjectPlural: 'S.O.S. Condo - {{count}} tâches requièrent des demandes de service',
        reminderHeader: 'Rappel – Demandes de service à créer',
        reminderDear: 'Bonjour {{name}},',
        reminderIntroOne: 'Vous avez 1 tâche à réaliser dans les 30 prochains jours pour laquelle une demande de service doit être créée.',
        reminderIntroMany: 'Vous avez {{count}} tâches à réaliser dans les 30 prochains jours pour lesquelles des demandes de service doivent être créées.',
        reminderTasksRequiring: 'Tâches nécessitant une demande de service :',
        reminderProperty: 'Propriété :',
        reminderDueDate: 'Date d\'échéance :',
        reminderDays: 'jour',
        reminderDaysPlural: 'jours',
        reminderLoginPrompt: 'Veuillez vous connecter pour créer les demandes de service.',
        reminderRegards: 'Cordialement, S.O.S. Condo',
        reminderFooter: 'Ceci est un message automatique de S.O.S. Condo. Veuillez ne pas répondre directement à ce courriel.',
        welcomeSubject: 'Bienvenue sur S.O.S. Condo - Votre compte fournisseur de services',
        welcomeHeader: 'Bienvenue sur S.O.S. Condo',
        welcomeIntro: 'Votre compte fournisseur de services a été créé. Utilisez les identifiants ci-dessous pour vous connecter.',
        welcomeUsernameLabel: 'Nom d\'utilisateur :',
        welcomePasswordLabel: 'Mot de passe :',
        welcomeLoginButton: 'Connexion',
        welcomeFooter: 'Ceci est un message automatique de S.O.S. Condo. Veuillez ne pas répondre directement à ce courriel.',
        welcomePMSubject: 'Bienvenue sur S.O.S. Condo - Votre compte gestionnaire',
        welcomePMHeader: 'Bienvenue sur S.O.S. Condo',
        welcomePMIntro: 'Votre compte gestionnaire de biens a été créé. Utilisez les identifiants ci-dessous pour vous connecter.',
    },
};
/** Supported email language codes (derived from EMAIL_STRINGS). Add new language = add new key to EMAIL_STRINGS above. */
exports.SUPPORTED_EMAIL_LANGS = Object.keys(EMAIL_STRINGS);
/** Optional: map language code to Intl locale for date/number formatting. Add entries when you add languages. */
const EMAIL_LANG_TO_LOCALE = {
    en: 'en-US',
    fr: 'fr-CA',
};
/** Resolves requested language to a supported code; falls back to DEFAULT_EMAIL_LANG if unknown. */
function getEmailLang(lang) {
    const l = (lang || '').toLowerCase().substring(0, 2);
    if (l && l in EMAIL_STRINGS)
        return l;
    return DEFAULT_EMAIL_LANG;
}
/** Returns Intl locale for the given language (e.g. for toLocaleString). */
function getEmailLocale(lang) {
    var _a;
    const code = getEmailLang(lang);
    return (_a = EMAIL_LANG_TO_LOCALE[code]) !== null && _a !== void 0 ? _a : 'en-US';
}
/** Returns email strings for the given language (always returns a valid entry). */
function getEmailStrings(lang) {
    var _a;
    const key = getEmailLang(lang);
    return (_a = EMAIL_STRINGS[key]) !== null && _a !== void 0 ? _a : EMAIL_STRINGS[DEFAULT_EMAIL_LANG];
}
// ============================================
// Send Service Request Email
// ============================================
// This function triggers when a new service request is created
// and sends the generated email to the service provider
exports.onServiceRequestCreated = functions.firestore
    .document('requests/{requestId}')
    .onCreate(async (snapshot, context) => {
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
        const providerEmail = providerData === null || providerData === void 0 ? void 0 : providerData.email;
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
        const reqLang = requestData.language;
        const s = getEmailStrings(reqLang);
        // Parse the generated email to extract subject and body
        const emailContent = requestData.generatedEmail;
        let subject = `S.O.S. Condo - ${s.requestHeaderSubtitle}`;
        let body = emailContent;
        // Try to extract subject from the email content if it starts with "Subject:"
        const subjectMatch = emailContent.match(/^Subject:\s*(.+?)(\n|$)/i);
        if (subjectMatch) {
            subject = subjectMatch[1].trim();
            body = emailContent.substring(subjectMatch[0].length).trim();
        }
        // Send the email (language from request)
        const mailOptions = {
            from: config.from,
            to: providerEmail,
            subject: subject,
            text: body,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">S.O.S. Condo</h1>
              <p style="margin: 5px 0 0 0;">${s.requestHeaderSubtitle}</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
              <div style="white-space: pre-wrap; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>
            </div>
            <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">${s.requestLoginPrompt}</p>
              <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
            </div>
            <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
              <p style="margin: 0;">${s.requestFooter}</p>
            </div>
          </div>
        `,
        };
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
    }
    catch (error) {
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
exports.onServiceRequestUpdated = functions.firestore
    .document('requests/{requestId}')
    .onUpdate(async (change, context) => {
    var _a;
    const requestId = context.params.requestId;
    console.log(`[onServiceRequestUpdated] TRIGGERED for request ${requestId}`);
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const beforeStatus = beforeData.status;
    const afterStatus = afterData.status;
    if (beforeStatus === afterStatus) {
        console.log(`[onServiceRequestUpdated] Request ${requestId} updated but status unchanged (${afterStatus}). Skipping email.`);
        return null;
    }
    console.log(`[onServiceRequestUpdated] Request ${requestId} status changed ${beforeStatus} -> ${afterStatus}. Sending email to Property Manager.`);
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
        const buildingId = taskData === null || taskData === void 0 ? void 0 : taskData.buildingId;
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
        const propertyManagerId = buildingData === null || buildingData === void 0 ? void 0 : buildingData.createdBy;
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
        const managerEmail = managerData === null || managerData === void 0 ? void 0 : managerData.email;
        const managerName = (managerData === null || managerData === void 0 ? void 0 : managerData.username) || 'Property Manager';
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
        const taskName = (taskData === null || taskData === void 0 ? void 0 : taskData.name) || 'Maintenance Task';
        const buildingName = (buildingData === null || buildingData === void 0 ? void 0 : buildingData.name) || 'Property';
        const buildingAddress = (buildingData === null || buildingData === void 0 ? void 0 : buildingData.address) || '';
        // Get provider name safely
        let providerName = 'Service Provider';
        if (afterData.providerId) {
            try {
                const providerDoc = await db.collection('providers').doc(afterData.providerId).get();
                if (providerDoc.exists) {
                    providerName = ((_a = providerDoc.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Service Provider';
                }
            }
            catch (error) {
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
        // Create email content (language from Property Manager's profile; fallback to en so email always sends)
        const statusLabels = {
            'Sent': 'Sent',
            'Accepted': 'Accepted',
            'Refused': 'Refused',
            'In Progress': 'In Progress',
            'Completed': 'Completed',
        };
        const newStatusLabel = statusLabels[afterStatus] || afterStatus;
        const oldStatusLabel = statusLabels[beforeStatus] || beforeStatus;
        let s;
        let changedAtStr;
        try {
            s = getEmailStrings(managerData === null || managerData === void 0 ? void 0 : managerData.language);
            changedAtStr = new Date().toLocaleString(getEmailLocale(managerData === null || managerData === void 0 ? void 0 : managerData.language));
        }
        catch (langErr) {
            console.warn('Language fallback for status email:', langErr);
            s = getEmailStrings('en');
            changedAtStr = new Date().toLocaleString('en-US');
        }
        const subject = s.statusUpdateSubject.replace('{{newStatus}}', newStatusLabel);
        const dear = s.statusUpdateDear.replace(/\{\{name\}\}/g, managerName);
        const textBody = `
${s.statusUpdateHeader}

${dear}

${s.statusUpdateIntro}

${s.statusUpdateRequestDetails}
- ${s.statusUpdateTask} ${taskName}
- ${s.statusUpdateProperty} ${buildingName}
- ${s.statusUpdateAddress} ${buildingAddress}
- ${s.statusUpdateServiceProvider} ${providerName}
- ${s.statusUpdateScheduledDate} ${scheduledDate}
- ${s.statusUpdateEstimatedCost} ${estimatedCost}

${s.statusUpdateStatusChange}
- ${s.statusUpdatePreviousStatus} ${oldStatusLabel}
- ${s.statusUpdateNewStatus} ${newStatusLabel}
- ${s.statusUpdateChangedBy} ${changedBy}
- ${s.statusUpdateChangedAt} ${changedAtStr}

${s.statusUpdateLoginPrompt}

${s.statusUpdateRegards}
      `.trim();
        const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">S.O.S. Condo</h1>
            <p style="margin: 5px 0 0 0;">${s.statusUpdateHeader}</p>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${dear}</p>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151;">${s.statusUpdateIntro}</p>
            
            <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">${s.statusUpdateRequestDetails}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; font-weight: 600; color: #374151; width: 140px;">${s.statusUpdateTask}</td><td style="padding: 6px 0; color: #6b7280;">${taskName}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">${s.statusUpdateProperty}</td><td style="padding: 6px 0; color: #6b7280;">${buildingName}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">${s.statusUpdateAddress}</td><td style="padding: 6px 0; color: #6b7280;">${buildingAddress}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">${s.statusUpdateServiceProvider}</td><td style="padding: 6px 0; color: #6b7280;">${providerName}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">${s.statusUpdateScheduledDate}</td><td style="padding: 6px 0; color: #6b7280;">${scheduledDate}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: 600; color: #374151;">${s.statusUpdateEstimatedCost}</td><td style="padding: 6px 0; color: #6b7280;">${estimatedCost}</td></tr>
              </table>
            </div>
            <div style="background-color: #eff6ff; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb; margin-bottom: 16px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">${s.statusUpdateStatusChange}</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #374151;">
                <strong>${s.statusUpdatePreviousStatus}</strong> <span style="color: #6b7280;">${oldStatusLabel}</span><br>
                <strong>${s.statusUpdateNewStatus}</strong> <span style="color: #2563eb; font-weight: 600;">${newStatusLabel}</span><br>
                <strong>${s.statusUpdateChangedBy}</strong> <span style="color: #6b7280;">${changedBy}</span><br>
                <strong>${s.statusUpdateChangedAt}</strong> <span style="color: #6b7280;">${changedAtStr}</span>
              </p>
            </div>
          </div>
          <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">${s.statusUpdateLoginPrompt}</p>
            <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
          </div>
          <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
            <p style="margin: 0;">${s.statusUpdateFooter}</p>
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
    }
    catch (error) {
        console.error('Error sending status update email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});
// ============================================
// Scheduled Task Reminder Email to Property Managers
// ============================================
// Shared logic: finds tasks due in 30 days without a Service Request,
// groups by Property Manager, sends one email per manager.
// callerLanguage: when set (e.g. from "Send reminders now" button), used as fallback when a manager has no language saved.
async function runTaskReminderJob(callerLanguage) {
    console.log('Running task reminder email job');
    const db = admin.firestore();
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    try {
        // Get all tasks
        const tasksSnapshot = await db.collection('tasks').get();
        const allTasks = tasksSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get all service requests to check which tasks already have requests
        const requestsSnapshot = await db.collection('requests').get();
        const taskIdsWithRequests = new Set(requestsSnapshot.docs.map(doc => doc.data().taskId).filter(Boolean));
        // Filter tasks that:
        // 1. Are due within the next 30 days
        // 2. Have status "New" (not yet sent)
        // 3. Don't already have a Service Request
        // 4. Are not master recurring tasks (only one-time instances)
        const tasksNeedingRequests = allTasks.filter((task) => {
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
        const buildings = new Map(buildingsSnapshot.docs.map(doc => [doc.id, Object.assign({ id: doc.id }, doc.data())]));
        const usersSnapshot = await db.collection('users').get();
        const users = new Map(usersSnapshot.docs.map(doc => [doc.id, Object.assign({ id: doc.id }, doc.data())]));
        const tasksByManager = new Map();
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
            tasksByManager.get(propertyManagerId).push({
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
            const managerEmail = manager.email;
            const managerName = manager.username || 'Property Manager';
            // Sort tasks by date
            taskList.sort((a, b) => {
                const dateA = a.task.taskDate || a.task.startDate || '';
                const dateB = b.task.taskDate || b.task.startDate || '';
                return dateA.localeCompare(dateB);
            });
            // Email in Property Manager's preferred language, or caller's app language if PM has none saved
            const lang = manager.language || callerLanguage;
            const s = getEmailStrings(lang);
            const count = taskList.length;
            const subject = count > 1
                ? s.reminderSubjectPlural.replace('{{count}}', String(count))
                : s.reminderSubject.replace('{{count}}', '1');
            const dear = s.reminderDear.replace(/\{\{name\}\}/g, managerName);
            const intro = count > 1 ? s.reminderIntroMany.replace(/\{\{count\}\}/g, String(count)) : s.reminderIntroOne;
            const dateLocale = getEmailLocale(lang);
            const dayLabel = (d) => d !== 1 ? s.reminderDaysPlural : s.reminderDays;
            const taskListHtml = taskList.map(({ task, building }) => {
                const taskDate = task.taskDate || task.startDate || 'Not specified';
                const formattedDate = new Date(taskDate + 'T12:00:00Z').toLocaleDateString(dateLocale);
                const daysUntilDue = Math.ceil((new Date(taskDate + 'T12:00:00Z').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; vertical-align: top;">
                <strong style="color: #111827; font-size: 14px;">${task.name || 'Unnamed Task'}</strong>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${task.description || 'No description'}</p>
                <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                  <span style="display: inline-block; margin-right: 12px;"><strong>${s.reminderProperty}</strong> ${building.name || 'Unknown'}</span>
                  <span style="display: inline-block; margin-right: 12px;"><strong>${s.reminderDueDate}</strong> ${formattedDate} (${daysUntilDue} ${dayLabel(daysUntilDue)})</span>
                  ${task.specialty ? `<span style="display: inline-block;"><strong>Specialty:</strong> ${task.specialty}</span>` : ''}
                </div>
              </td>
            </tr>
          `;
            }).join('');
            const textBody = `
${s.reminderHeader}

${dear}

${intro}

${taskList.map(({ task, building }) => {
                const taskDate = task.taskDate || task.startDate || 'Not specified';
                const formattedDate = new Date(taskDate + 'T12:00:00Z').toLocaleDateString(dateLocale);
                const daysUntilDue = Math.ceil((new Date(taskDate + 'T12:00:00Z').getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return `- ${task.name || 'Unnamed Task'} (${building.name || 'Unknown'}) - ${s.reminderDueDate} ${formattedDate} (${daysUntilDue} ${dayLabel(daysUntilDue)})`;
            }).join('\n')}

${s.reminderLoginPrompt}

${s.reminderRegards}
        `.trim();
            const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">S.O.S. Condo</h1>
              <p style="margin: 5px 0 0 0;">${s.reminderHeader}</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${dear}</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #374151;">${intro}</p>
              <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">${s.reminderTasksRequiring}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${taskListHtml}
                </table>
              </div>
            </div>
            <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">${s.reminderLoginPrompt}</p>
              <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
            </div>
            <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
              <p style="margin: 0;">${s.reminderFooter}</p>
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
            }
            catch (error) {
                console.error(`Error sending email to ${managerEmail}:`, error);
            }
        }
        console.log(`Task reminder job completed. ${emailsSent} email${emailsSent !== 1 ? 's' : ''} sent.`);
        return { success: true, emailsSent, tasksFound: tasksNeedingRequests.length };
    }
    catch (error) {
        console.error('Error in task reminder job:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
// Scheduled: runs daily at 9:00 AM America/Montreal
exports.sendTaskReminderEmails = functions.pubsub
    .schedule('every day 09:00')
    .timeZone('America/Montreal')
    .onRun(async () => runTaskReminderJob());
// Callable: trigger the same job now (for testing). Super Admin only. Pass language so emails use caller's app language when recipient has none saved.
exports.sendTaskReminderEmailsNow = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    }
    const db = admin.firestore();
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User not found.');
    }
    const role = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== 'Super Admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admin can run this.');
    }
    const callerLang = (data === null || data === void 0 ? void 0 : data.language) ? String(data.language).toLowerCase().substring(0, 2) : undefined;
    const result = await runTaskReminderJob(callerLang);
    return result !== null && result !== void 0 ? result : { success: false, error: 'No result' };
});
exports.sendServiceRequestEmail = functions.https.onCall(async (data, context) => {
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
    if (!(requestData === null || requestData === void 0 ? void 0 : requestData.generatedEmail)) {
        throw new functions.https.HttpsError('failed-precondition', 'No generated email content found.');
    }
    // Get the service provider
    const providerDoc = await db.collection('providers').doc(requestData.providerId).get();
    if (!providerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Service provider not found.');
    }
    const providerData = providerDoc.data();
    const providerEmail = providerData === null || providerData === void 0 ? void 0 : providerData.email;
    if (!providerEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Provider has no email address.');
    }
    // Create the email transporter
    const transporter = createTransporter();
    if (!transporter) {
        throw new functions.https.HttpsError('failed-precondition', 'Email service not configured.');
    }
    const config = getEmailConfig();
    const s = getEmailStrings(requestData.language);
    // Parse the generated email
    const emailContent = requestData.generatedEmail;
    let subject = `S.O.S. Condo - ${s.requestHeaderSubtitle}`;
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
            <p style="margin: 5px 0 0 0;">${s.requestHeaderSubtitle}</p>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>
          </div>
          <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">${s.requestLoginPrompt}</p>
            <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Login</a>
          </div>
          <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
            <p style="margin: 0;">${s.requestFooter}</p>
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
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Failed to send email');
    }
});
exports.createUser = functions.https.onCall(async (data, context) => {
    var _a;
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
    const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    const canCreateUsers = callerRole === 'Super Admin' || callerRole === 'Admin' || callerRole === 'Property Manager';
    if (!canCreateUsers) {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admin, Admin, or Property Manager can create users.');
    }
    // Super Admin: Admin, Property Manager, Service Provider
    // Admin: Property Manager, Service Provider
    // Property Manager: Service Provider only
    const { email, password, username, role, createdBy } = data;
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    const address = typeof data.address === 'string' ? data.address.trim() : '';
    if (!email || !password || !username || !role || !createdBy) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    functions.logger.info('[createUser] role=' + role + ' phone=' + (phone || '(empty)') + ' address=' + (address || '(empty)'));
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
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new functions.https.HttpsError('invalid-argument', msg);
    }
    const userProfile = {
        email,
        username,
        role,
        createdBy,
    };
    if (phone !== '')
        userProfile.phone = phone;
    if (address !== '')
        userProfile.address = address;
    await db.collection('users').doc(userRecord.uid).set(userProfile);
    functions.logger.info('[createUser] wrote userProfile keys: ' + Object.keys(userProfile).join(', '));
    // Send welcome email when new user is a Service Provider or Property Manager
    if (role === 'Service Provider' || role === 'Property Manager') {
        const transporter = createTransporter();
        if (transporter) {
            const config = getEmailConfig();
            const s = getEmailStrings(data.language);
            const subject = role === 'Property Manager' ? s.welcomePMSubject : s.welcomeSubject;
            const intro = role === 'Property Manager' ? s.welcomePMIntro : s.welcomeIntro;
            const header = role === 'Property Manager' ? s.welcomePMHeader : s.welcomeHeader;
            const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">S.O.S. Condo</h1>
            <p style="margin: 5px 0 0 0;">${header}</p>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${intro}</p>
            <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827;"><strong>${s.welcomeUsernameLabel}</strong> ${username}</p>
              <p style="margin: 0; font-size: 14px; color: #111827;"><strong>${s.welcomePasswordLabel}</strong> ${password}</p>
            </div>
          </div>
          <div style="padding: 24px 20px; text-align: center; background-color: #ffffff;">
            <a href="https://app.soscondo.ca/" style="display: inline-block; background-color: #0f9266; color: white; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; border: 2px solid #0a6b4a; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${s.welcomeLoginButton}</a>
          </div>
          <div style="padding: 15px; background-color: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
            <p style="margin: 0;">${s.welcomeFooter}</p>
          </div>
        </div>
      `;
            try {
                await transporter.sendMail({
                    from: config.from,
                    to: email,
                    subject,
                    html: htmlBody,
                    text: `${intro}\n\n${s.welcomeUsernameLabel} ${username}\n${s.welcomePasswordLabel} ${password}\n\n${s.welcomeLoginButton}: https://app.soscondo.ca/`,
                });
                console.log(`Welcome email sent to new ${role}: ${email}`);
            }
            catch (mailErr) {
                console.error('Failed to send welcome email (user was created):', mailErr);
                // Do not fail the createUser call; the account was created successfully
            }
        }
    }
    return { uid: userRecord.uid };
});
exports.changeUserPassword = functions.https.onCall(async (data, context) => {
    var _a, _b;
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
        const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
        const canChangeOthers = callerRole === 'Super Admin' || callerRole === 'Admin';
        if (!canChangeOthers) {
            throw new functions.https.HttpsError('permission-denied', 'Only Super Admin or Admin can change other users\' passwords.');
        }
        const targetUserDoc = await db.collection('users').doc(userId).get();
        if (!targetUserDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found.');
        }
        const targetUserRole = (_b = targetUserDoc.data()) === null || _b === void 0 ? void 0 : _b.role;
        if (callerRole === 'Admin') {
            if (targetUserRole === 'Super Admin' || targetUserRole === 'Admin') {
                throw new functions.https.HttpsError('permission-denied', 'Admins cannot change passwords for Super Admins or other Admins.');
            }
        }
    }
    else {
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
    }
    catch (error) {
        console.error('Error changing password:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Failed to change password');
    }
});
//# sourceMappingURL=index.js.map