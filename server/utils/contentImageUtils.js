/**
 * Moves images from a temp directory to a permanent directory for a content entity,
 * and updates image src URLs in the entity's images array.
 *
 * @param {object} opts
 * @param {object} opts.path - Node.js path module
 * @param {object} opts.fs - Node.js fs module (with promises)
 * @param {string} opts.baseImageDir - Base directory for post images
 * @param {string} opts.folderName - Entity folder name (e.g. 'blog', 'press', 'media')
 * @param {object} opts.entity - The created entity object (must have id and images)
 * @param {function} opts.updateFn - async function(id, data) to update entity in DB
 */
const moveTempImagesToEntity = async ({ path, fs, baseImageDir, folderName, entity, updateFn }) => {
    const fsPromises = fs.promises;
    const tempDir = path.join(baseImageDir, folderName, 'temp', 'images');
    const targetDir = path.join(baseImageDir, folderName, String(entity.id), 'images');

    let tempExists = false;
    try {
        await fsPromises.access(tempDir);
        tempExists = true;
    } catch (_error) {
        // temp directory does not exist, nothing to move
    }

    if (!tempExists) {
        return;
    }

    // Move files from temp to permanent directory
    await fsPromises.mkdir(targetDir, { recursive: true });
    const files = await fsPromises.readdir(tempDir);

    for (const file of files) {
        const sourcePath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        await fsPromises.rename(sourcePath, targetPath);
    }

    // Remove temp directory
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => { });

    // Update image URLs in the entity
    if (entity.images && Array.isArray(entity.images)) {
        const tempUrlSegment = `/postimages/${folderName}/temp/images/`;
        const permanentUrlSegment = `/postimages/${folderName}/${String(entity.id)}/images/`;

        entity.images = entity.images.map((img) => {
            if (img.src && img.src.includes(tempUrlSegment)) {
                return {
                    ...img,
                    src: img.src.replace(tempUrlSegment, permanentUrlSegment),
                };
            }
            return img;
        });

        // Persist updated image URLs
        await updateFn(entity.id, { images: entity.images });
    }
};

module.exports = { moveTempImagesToEntity };
