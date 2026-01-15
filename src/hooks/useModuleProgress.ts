import { useMemo } from 'react';
import { getModuleStatuses, calculateModuleCompletion } from '@/lib/completionScore';
import { getMissingFieldsForModule, canChangeToPresentation } from '@/lib/missingFields';
import type { EstimationData } from '@/types/estimation';
import type { ModuleStatus } from '@/lib/completionScore';
import type { MissingField, PresentationBlocker } from '@/lib/missingFields';

interface UseModuleProgressResult {
  moduleStatuses: ModuleStatus[];
  currentModuleCompletion: number;
  totalCompletion: number;
  missingFields: MissingField[];
  canProceed: boolean;
  presentationBlocker: PresentationBlocker;
}

export function useModuleProgress(
  estimation: EstimationData | null,
  estimationId: string,
  currentModuleNumber: number
): UseModuleProgressResult {
  const moduleStatuses = useMemo(() => {
    return getModuleStatuses(estimation, estimationId);
  }, [estimation, estimationId]);

  const completion = useMemo(() => {
    return calculateModuleCompletion(estimation);
  }, [estimation]);

  const currentModuleCompletion = useMemo(() => {
    const key = `module${currentModuleNumber}` as keyof typeof completion;
    return completion[key] || 0;
  }, [completion, currentModuleNumber]);

  const { fields: missingFields, canProceed } = useMemo(() => {
    return getMissingFieldsForModule(currentModuleNumber, estimation);
  }, [currentModuleNumber, estimation]);

  const presentationBlocker = useMemo(() => {
    return canChangeToPresentation(estimation);
  }, [estimation]);

  return {
    moduleStatuses,
    currentModuleCompletion,
    totalCompletion: completion.total,
    missingFields,
    canProceed,
    presentationBlocker
  };
}
