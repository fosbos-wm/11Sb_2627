/* =========================================================
   Verbindung zum Firebase-Projekt der 11Sb_2627.
   Diese Datei ist die EINZIGE, die du nach dem Anlegen des
   neuen Firebase-Projekts (Region europe-west3, Frankfurt)
   anpassen musst: Werte aus Projekteinstellungen → Allgemein →
   „Meine Apps“ → Web-App → SDK-Konfiguration einsetzen.
   ========================================================= */
export const firebaseConfig = {
  apiKey: "HIER_API_KEY",
  authDomain: "HIER_PROJEKT-ID.firebaseapp.com",
  projectId: "HIER_PROJEKT-ID",
  storageBucket: "HIER_PROJEKT-ID.firebasestorage.app",
  messagingSenderId: "HIER_SENDER_ID",
  appId: "HIER_APP_ID"
};
/* Kürzel der Klasse (steht in den Zugangscodes als Klassenmarkierung). */
export const APP_KLASSE = "11sb2627";
/* Technische Domain für die Anmelde-Adressen (pseudonym@<domain>). Sie wird den
   Schülern nie angezeigt und es werden dorthin keine E-Mails versendet.
   NACH dem ersten Einrichten eines Schülerkontos NICHT mehr ändern. */
export const APP_MAILDOMAIN = "11sb2627.invalid";
