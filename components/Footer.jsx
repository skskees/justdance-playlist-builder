'use client';

import {useState, useEffect, useRef} from "react";

export default function Footer() {
    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef(null);

    //sync state with browser dialog behavior
    useEffect(() => {
        const dialog  = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [isOpen]);

    //handle "esc" to exit modal
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e) => {
            e.preventDefault(); 
            setIsOpen(false);
        };

        dialog.addEventListener("cancel", handleCancel);
        return () => dialog.removeEventListener("cancel", handleCancel);
    }, []);

return (
<footer className="site-footer">
    {/* Container to force inline alignment */}
    <div className="footer-inline-content">
    <p className="footer-text">
        Icons by:{" "}
        <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="admin-link">
        Icons8
        </a>
    </p>
    
    <span className="footer-separator">&bull;</span>

    <button onClick={() => setIsOpen(true)} className="footer-modal-trigger">
        About This Site
    </button>
    </div>

    {/* Accessible native pop-up box */}
    <dialog ref={dialogRef} className="info-modal">
    <div className="modal-header">
        <h2>About Me</h2>
        <button onClick={() => setIsOpen(false)} className="close-btn" aria-label="Close modal">
        &times;
        </button>
    </div>
    <div className="modal-body">
        <p>Hi! I'm <a href="https://github.com/skskees" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none', color: '#e0b5b5'}}>Skyler</a>, the developer of the Just Dance Playlist Builder.</p>
        <p>This is a passion project built to replace the hole in my heart that Ubisoft left when they discontinued Just Dance Unlimited in July 2024.</p>
        <p>Just Dance+ just isn't the same, and they don't include all of the songs to experience at once!</p>
        <p style={{textDecoration: 'underline'}}>Planned Features</p>
        <ul>
            <li>Alternate Versions (Just Sweat, Extreme, etc)</li>
            <li>Favorites</li>
            <li>Suggest Something</li>
        </ul>
    </div>
    </dialog>
</footer>
);
}