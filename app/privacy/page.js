import LegalPage from "../../components/LegalPage";
import {readLegalDoc} from "../../lib/legalDocs";

export const dynamic = "force-static";

export const metadata = {
    title: "Privacy Policy | The Dance Playlist Builder",
    description: "How The Dance Playlist Builder collects, uses, and discloses information.",
};

export default function PrivacyPolicyPage() {
    return <LegalPage blocks={readLegalDoc("privacy_policy.md")} />;
}
