"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
function generateSlug(name) {
    let slug = name.toLowerCase();
    // Remove non-alphanumeric, spaces or dashes
    slug = slug.replace(/[^a-z0-9\s-]/g, "");
    // Replace spaces/whitespace with single dash
    slug = slug.replace(/\s+/g, "-");
    // Replace multiple dashes with single dash
    slug = slug.replace(/-+/g, "-");
    // Trim leading/trailing dashes
    slug = slug.replace(/^-+|-+$/g, "");
    return slug;
}
