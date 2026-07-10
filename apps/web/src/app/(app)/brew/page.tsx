'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StepperWizard } from '@/components/brew/stepper-wizard';
import { WizardStepBean } from '@/components/brew/wizard-steps/wizard-step-bean';
import { WizardStepEquipment } from '@/components/brew/wizard-steps/wizard-step-equipment';
import { WizardStepTaste } from '@/components/brew/wizard-steps/wizard-step-taste';
import { WizardStepVolume } from '@/components/brew/wizard-steps/wizard-step-volume';
import { Button } from '@/components/ui/button';
import { useBrewWizardStore, WIZARD_STEPS } from '@/features/brew/use-brew-wizard';

const STEP_TITLES: Record<(typeof WIZARD_STEPS)[number], string> = {
  bean: '豆',
  equipment: '器具',
  taste: '味の好み',
  volume: '量・温度',
};

export default function BrewWizardPage() {
  const router = useRouter();
  const { stepIndex, input, setField, next, back } = useBrewWizardStore();

  const step = WIZARD_STEPS[stepIndex] ?? 'bean';
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;
  const canProceed = step !== 'equipment' || !!input.equipment.dripperId;

  function handlePatch(patch: Partial<typeof input>) {
    for (const [key, value] of Object.entries(patch)) {
      setField(key as keyof typeof input, value as never);
    }
  }

  function handleNext() {
    if (isLastStep) {
      router.push('/brew/result');
      return;
    }
    next();
  }

  return (
    <StepperWizard stepIndex={stepIndex} stepCount={WIZARD_STEPS.length} title={STEP_TITLES[step]}>
      {step === 'bean' && <WizardStepBean input={input} onChange={handlePatch} />}
      {step === 'equipment' && <WizardStepEquipment input={input} onChange={handlePatch} />}
      {step === 'taste' && <WizardStepTaste input={input} onChange={handlePatch} />}
      {step === 'volume' && <WizardStepVolume input={input} onChange={handlePatch} />}

      <div className="mt-2 flex items-center gap-2">
        {stepIndex > 0 && (
          <Button variant="outline" size="lg" onClick={back}>
            <ChevronLeft size={18} aria-hidden="true" />
            戻る
          </Button>
        )}
        <Button size="lg" className="flex-1" onClick={handleNext} disabled={!canProceed}>
          {isLastStep ? 'レシピを生成' : '次へ'}
        </Button>
      </div>
    </StepperWizard>
  );
}
