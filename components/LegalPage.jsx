import {Fragment} from "react";

//shared renderer for the privacy policy and terms of service documents
export default function LegalPage({blocks}) {
    return (
        <main className="legal-page">
            {blocks.map((block, i) => {
                const content = block.spans.map((span, j) =>
                    span.bold
                        ? <strong key={j}>{span.text}</strong>
                        : <Fragment key={j}>{span.text}</Fragment>
                );

                if (block.type === "h1") return <h1 key={i}>{content}</h1>;
                if (block.type === "h2") return <h2 key={i}>{content}</h2>;
                if (block.type === "h3") return <h3 key={i}>{content}</h3>;
                return <p key={i}>{content}</p>;
            })}

            <a href="/" className="legal-back">&larr; Back to The Dance Playlist Builder</a>
        </main>
    );
}
