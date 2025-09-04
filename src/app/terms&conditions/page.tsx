"use client";
import React from "react";
import Link from "next/link";
import ProfileMenu from "../component/profile";
export default function TermsConditions() {
  return (
    <main className="min-h-screen px-6 py-10 relative">
      <ProfileMenu session={null} userScores={null} isDark={false} signOut={function (): void {
        throw new Error("Function not implemented.");
      } }/>
      <div className="absolute top-[-40px] right-0 w-80 h-80 bg-gradient-to-br from-blue-500 via-cyan-500 to-transparent opacity-18 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute z-[-1] bottom-0 left-[-130px] w-90 h-60 bg-gradient-to-tl from-purple-500 via-pink-600 to-transparent opacity-15 rounded-t-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative">
        <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Last updated: August 26, 2025
        </p>

        <nav className="mt-6 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="#acceptance" className="hover:underline">1. Acceptance of Terms</a></li>
            <li><a href="#accounts" className="hover:underline">2. Accounts &amp; Security</a></li>
            <li><a href="#use" className="hover:underline">3. Permitted Use</a></li>
            <li><a href="#prohibited" className="hover:underline">4. Prohibited Security-Abuse Activities</a></li>
            <li><a href="#ai" className="hover:underline">5. AI-Specific Disclosures</a></li>
            <li><a href="#data" className="hover:underline">6. Data Handling &amp; Confidentiality</a></li>
            <li><a href="#incident" className="hover:underline">7. Vulnerability Reporting &amp; Incident Response</a></li>
            <li><a href="#compliance" className="hover:underline">8. Compliance &amp; Export Controls</a></li>
            <li><a href="#thirdparty" className="hover:underline">9. Third-Party &amp; Integrations</a></li>
            <li><a href="#ip" className="hover:underline">10. Intellectual Property</a></li>
            <li><a href="#service" className="hover:underline">11. Service Availability, Rate Limits &amp; Support</a></li>
            <li><a href="#disclaimer" className="hover:underline">12. Disclaimers</a></li>
            <li><a href="#liability" className="hover:underline">13. Limitation of Liability</a></li>
            <li><a href="#indemnity" className="hover:underline">14. Indemnification</a></li>
            <li><a href="#termination" className="hover:underline">15. Suspension &amp; Termination</a></li>
            <li><a href="#law" className="hover:underline">16. Governing Law</a></li>
            <li><a href="#changes" className="hover:underline">17. Changes to These Terms</a></li>
            <li><a href="#contact" className="hover:underline">18. Contact</a></li>
          </ul>
        </nav>

        <section id="acceptance" className="mt-8 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using our cybersecurity AI chatbot and related services (the “Service”), you agree to these Terms &amp; Conditions (“Terms”).
            If you do not agree, do not use the Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization.
          </p>
        </section>

        <section id="accounts" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">2. Accounts &amp; Security</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide accurate account information and keep credentials confidential.</li>
            <li>You are responsible for all activities under your account. Notify us immediately of any suspected compromise or unauthorized use.</li>
            <li>We may require multi-factor authentication, enforce session timeouts, and apply risk-based controls to protect the Service.</li>
          </ul>
        </section>

        <section id="use" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">3. Permitted Use</h2>
          <p>
            The Service is intended to help users learn, analyze, and operationalize cybersecurity best practices, detection logic, and related workflows.
            You may use the Service only for lawful, ethical security purposes and in compliance with these Terms and applicable policies.
          </p>
        </section>

        <section id="prohibited" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">4. Prohibited Security-Abuse Activities</h2>
          <p>Using the Service to harm others or to facilitate unlawful or unethical activity is strictly prohibited. Examples include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Generating or operationalizing malware, ransomware, botnets, worms, trojans, keyloggers, or exploit code intended to cause harm.</li>
            <li>Creating phishing kits, social-engineering playbooks targeting real victims, or instructions to bypass authentication/authorization without permission.</li>
            <li>Attempting to exfiltrate, deanonymize, or misuse personal data or confidential information.</li>
            <li>Probing or testing systems you do not own or lack explicit written authorization to assess (“no unauthorized pentesting”).</li>
            <li>Circumventing Service rate limits, access controls, or safety filters; scraping at scale; or reverse engineering except as allowed by law.</li>
          </ul>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <em>Permitted research:</em> Security research on assets you own or are formally authorized to test is allowed, provided it complies with law and any engagement rules.
          </p>
        </section>

        <section id="ai" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">5. AI-Specific Disclosures</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Non-determinism &amp; errors.</strong> AI outputs may be inaccurate, incomplete, or outdated. Always validate before use in production or incident response.</li>
            <li><strong>No professional advice.</strong> Outputs are provided for informational purposes and do not constitute legal, compliance, or professional security advice.</li>
            <li><strong>Human-in-the-loop.</strong> You are responsible for reviewing and approving any actions, detections, or playbooks suggested by the Service.</li>
            <li><strong>Safety filters.</strong> We may block or redact requests/outputs that violate these Terms or our safety policies.</li>
          </ul>
        </section>

        <section id="data" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">6. Data Handling &amp; Confidentiality</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Customer Content.</strong> You retain ownership of content you submit (e.g., logs, alerts, IOCs, playbooks) and grant us a license to process it solely to provide, secure, and improve the Service.</li>
            <li><strong>Sensitive Inputs.</strong> Do not upload regulated or highly sensitive data (e.g., secrets, live PII, production keys) unless you have a lawful basis and appropriate safeguards in place.</li>
            <li><strong>Privacy Policy.</strong> Our data practices are described in our Privacy Policy.</li>
          </ul>
          <Link href="/privacy" className="hover:underline text-neutral-900 dark:text-neutral-100">
            View Privacy Policy
          </Link>
        </section>

        <section id="incident" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">7. Vulnerability Reporting &amp; Incident Response</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Report suspected vulnerabilities affecting the Service to <a className="hover:underline" href="mailto:security@example.com">security@example.com</a>. Do not publicly disclose without coordination.</li>
            <li>We may notify you of security incidents as required by law and take reasonable steps to mitigate impact.</li>
          </ul>
        </section>

        <section id="compliance" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">8. Compliance &amp; Export Controls</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must comply with all applicable laws, including data protection, security, and export control/sanctions regulations.</li>
            <li>You may not use the Service if you are located in an embargoed jurisdiction or are a sanctioned party.</li>
          </ul>
        </section>

        <section id="thirdparty" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">9. Third-Party &amp; Integrations</h2>
          <p>
            The Service may integrate with third-party tools (e.g., SIEM, ticketing, cloud providers, identity platforms).
            We are not responsible for third-party content or practices. Your use of integrations is subject to those providers’ terms.
          </p>
        </section>

        <section id="ip" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">10. Intellectual Property</h2>
          <p>
            We and our licensors own the Service and all related IP. Subject to your compliance with these Terms,
            we grant you a limited, non-exclusive, non-transferable license to access and use the Service.
          </p>
        </section>

        <section id="service" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">11. Service Availability, Rate Limits &amp; Support</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We may apply fair-use caps, throttling, or quotas to protect the platform.</li>
            <li>We may modify or discontinue features. We strive for high availability but do not guarantee uninterrupted access.</li>
            <li>Support channels and response targets (if any) may be described in a separate agreement or plan tier.</li>
          </ul>
        </section>

        <section id="disclaimer" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">12. Disclaimers</h2>
          <p>
            The Service is provided “AS IS” and “AS AVAILABLE,” without warranties of any kind, including merchantability,
            fitness for a particular purpose, non-infringement, or accuracy. Security detections, recommendations, and assessments
            are not guarantees of safety.
          </p>
        </section>

        <section id="liability" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">13. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages;
            or for lost profits, revenues, data, or business interruption, even if advised of the possibility. Our aggregate liability
            for claims relating to the Service is limited to fees you paid to us for the 12 months preceding the claim.
          </p>
        </section>

        <section id="indemnity" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">14. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold us harmless from claims arising out of your Content or your use of the Service,
            including violations of these Terms or applicable law.
          </p>
        </section>

        <section id="termination" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">15. Suspension &amp; Termination</h2>
          <p>
            We may suspend or terminate access immediately for any breach, suspected abuse, or to protect the Service or others.
            Upon termination, your right to use the Service ceases, but provisions that by their nature should survive will survive.
          </p>
        </section>

        <section id="law" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">16. Governing Law</h2>
          <p>
            These Terms are governed by the laws applicable in your organization’s jurisdiction (without regard to conflict-of-law rules).
            Venue and jurisdiction shall lie with the competent courts of that jurisdiction.
          </p>
        </section>

        <section id="changes" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">17. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Changes are effective when posted.
            Your continued use of the Service after changes become effective constitutes acceptance.
          </p>
        </section>

        <section id="contact" className="mt-6 space-y-4 leading-7">
          <h2 className="text-xl font-semibold">18. Contact</h2>
          <p>
            Questions or security concerns? Email <a className="hover:underline" href="mailto:support@example.com">support@example.com</a> or{" "}
            <a className="hover:underline" href="mailto:security@example.com">security@example.com</a>.
          </p>
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center rounded-md px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
