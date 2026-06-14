import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import allDarjeelingGPData from "@/Data/Parsed_data_of_all_Darjeeling_GP/Darjeeling_GP/All_GP_address_name_Ph_no.json";
import bdoOfficialGuideData from "@/Data/Parsed_data_of_all_Darjeeling_GP/Darjeeling_BDO/Darjeeling_Blocks_BDO_Official_Guide_2026.json";

export function useGPData(setCurrentView?: (view: any) => void) {
  const [gpSearchTerm, setGpSearchTerm] = useState("");
  const [gpSelectedBlock, setGpSelectedBlock] = useState("");
  const [selectedGP, setSelectedGP] = useState<any>(null);

  const gpData = allDarjeelingGPData as any;
  const bdoData = bdoOfficialGuideData as any;

  const gpBlocks = useMemo(() => {
    const blocks = (gpData.places as any[]).map((p: any) => p.block).filter(Boolean);
    return Array.from(new Set(blocks)).sort() as string[];
  }, [gpData]);

  const filteredGPs = useMemo(() => {
    let list = gpData.places as any[];
    if (gpSearchTerm.trim()) {
      const q = gpSearchTerm.toLowerCase().trim();
      list = list.filter((p: any) =>
        p.place_name.toLowerCase().includes(q) ||
        p.official_gp_name.toLowerCase().includes(q) ||
        p.block.toLowerCase().includes(q)
      );
    }
    if (gpSelectedBlock) {
      list = list.filter((p: any) => p.block === gpSelectedBlock);
    }
    return list;
  }, [gpSearchTerm, gpSelectedBlock, gpData]);

  const selectGP = useCallback((gp: any) => {
    setSelectedGP(gp);
    if (setCurrentView) setCurrentView("write");
    toast.success(`Selected ${gp.official_gp_name} GP for addressing`);
  }, [setCurrentView]);

  const copyGPSalutation = useCallback((gp: any) => {
    let sal = `The Pradhan,\n${gp.official_gp_name} Gram Panchayat,\n${gp.block} Block, Darjeeling District, West Bengal`;
    if (gp.pradhan?.name && !gp.pradhan.name.toLowerCase().includes('tbd')) {
      sal += `\n\nAttn: Pradhan ${gp.pradhan.name}`;
      if (gp.pradhan.phone && !gp.pradhan.phone.toLowerCase().includes('tbd')) sal += ` (${gp.pradhan.phone})`;
    } else if (gp.executive_assistant?.name && !gp.executive_assistant.name.toLowerCase().includes('tbd')) {
      sal += `\n\nAttn: Executive Assistant ${gp.executive_assistant.name}`;
      if (gp.executive_assistant.phone && !gp.executive_assistant.phone.toLowerCase().includes('tbd')) sal += ` (${gp.executive_assistant.phone})`;
    }
    navigator.clipboard.writeText(sal);
    toast.success('Salutation copied to clipboard');
  }, []);

  const getBDOForBlock = useCallback((blockName: string) => {
    if (!blockName) return null;
    const nameLower = blockName.toLowerCase().replace(/–/g, "-").trim();
    return bdoData.blocks.find((b: any) => {
      const bName = b.block_name.toLowerCase().replace(/–/g, "-").trim();
      return bName.includes(nameLower) || nameLower.includes(bName);
    });
  }, [bdoData]);

  return {
    gpSearchTerm,
    setGpSearchTerm,
    gpSelectedBlock,
    setGpSelectedBlock,
    selectedGP,
    setSelectedGP,
    gpBlocks,
    filteredGPs,
    selectGP,
    copyGPSalutation,
    bdoData,
    getBDOForBlock,
  };
}
