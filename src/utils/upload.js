// Add this to the existing upload.js
exports.deleteFiles = async (filePaths) => {
    for (const filePath of filePaths) {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }
  };