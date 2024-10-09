/** This function can throw */
// const readAsyncBlobAsArrayBuffer = async (
//     blob: Blob,
// ): Promise<string | ArrayBuffer | null> => {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.readAsArrayBuffer(blob);
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = () => reject(reader.error);
//     });
// };

export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
            if (reader.result === null || typeof reader.result !== "string") {
                reject("null result, or somehow arraybuffer");
                return;
            }
            const base64String = reader.result.split(",")[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
}
