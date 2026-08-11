import LegalPage from "../../components/LegalPage";
import {readLegalDoc} from "../../lib/legalDocs";

export const dynamic = "force-static";

export const metadata = {
    title: "Terms of Service | The Dance Playlist Builder",
    description: "The terms that govern your use of The Dance Playlist Builder.",
};

export default function TermsOfServicePage() {
    return <LegalPage blocks={readLegalDoc("terms_of_service.md")} />;
}
