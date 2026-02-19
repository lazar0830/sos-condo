"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.sendServiceRequestEmail = exports.onServiceRequestCreated = void 0;
const functions = require("firebase-functions");
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
        console.log('Update email tempalte');
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
    const requestDoc = await db.collection('serviceRequests').doc(requestId).get();
    if (!requestDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Service request not found.');
    }
    const requestData = requestDoc.data();
    if (!(requestData === null || requestData === void 0 ? void 0 : requestData.generatedEmail)) {
        throw new functions.https.HttpsError('failed-precondition', 'No generated email content found.');
    }
    // Get the service provider
    const providerDoc = await db.collection('serviceProviders').doc(requestData.providerId).get();
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
    await db.collection('users').doc(userRecord.uid).set(userProfile);
    return { uid: userRecord.uid };
});
//# sourceMappingURL=index.js.map