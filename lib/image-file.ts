"use client"

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || "")
      resolve(result.includes(",") ? result.split(",", 2)[1] : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error("Rasm o'qilmadi"))
    reader.readAsDataURL(file)
  })
}
