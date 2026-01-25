'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
    html: string;
    className?: string;
}

/**
 * SafeHTML component to replace dangerouslySetInnerHTML.
 * Uses DOMPurify to sanitize HTML content.
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className }) => {
    // Check if we are in a browser environment
    const isBrowser = typeof window !== 'undefined';

    if (!isBrowser) {
        return <div className={className} />;
    }

    const cleanHTML = DOMPurify.sanitize(html);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: cleanHTML }}
        />
    );
};
