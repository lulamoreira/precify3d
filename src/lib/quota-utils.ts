import { supabase } from "@/integrations/supabase/client";

/**
 * Normaliza um texto para uso em fingerprint (minúsculo, sem acentos, sem espaços extras)
 */
export function normalizeForFingerprint(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Gera um fingerprint para a peça sendo precificada
 */
export async function getPricingFingerprint(params: {
  fileHash?: string;
  projectName?: string;
  materialId?: string;
}): Promise<string> {
  // 1. Se tem hash de arquivo, ele é soberano
  if (params.fileHash) return params.fileHash;

  // 2. Senão, tenta nome do projeto + material
  if (params.projectName && params.materialId) {
    const normalized = normalizeForFingerprint(params.projectName);
    const raw = `${normalized}|${params.materialId}`;
    
    // Calcula sha256 simples no cliente
    const msgUint8 = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // 3. Fallback: UUID guardado no localStorage (sessão de trabalho)
  let jobUuid = localStorage.getItem('precify3d_job');
  if (!jobUuid) {
    jobUuid = crypto.randomUUID();
    localStorage.setItem('precify3d_job', jobUuid);
  }
  return jobUuid;
}

/**
 * Reseta o fingerprint da sessão de trabalho (usado ao limpar formulário)
 */
export function resetJobFingerprint() {
  localStorage.removeItem('precify3d_job');
}
