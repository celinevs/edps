const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function downloadFile(id_file: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/jawaban-user/download_file/${id_file}`, {
      method: "GET",
      credentials: "include", 
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    const contentDisposition = response.headers.get("content-disposition");
    let filename = "file.pdf";
    
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

// FOR AUTHENTICATION HEADER

// export async function downloadFile(id_file: string) {
//   try {
//     const token = localStorage.getItem("token"); // Adjust based on your auth setup
    
//     const response = await fetch(`/jawaban-user/download_file/${id_file}`, {
//       method: "GET",
//       headers: {
//         "Authorization": `Bearer ${token}`,
//       },
//       credentials: "include",
//     });

//     if (!response.ok) {
//       throw new Error(`Download failed: ${response.status} ${response.statusText}`);
//     }

//     const blob = await response.blob();
    
//     const contentDisposition = response.headers.get("content-disposition");
//     let filename = "file.pdf";
    
//     if (contentDisposition) {
//       const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
//       if (matches && matches[1]) { 
//         filename = matches[1].replace(/['"]/g, '');
//       }
//     }
    
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
//   } catch (error) {
//     console.error("Error downloading file:", error);
//     throw error;
//   }
// }