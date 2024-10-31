import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { FormConfig } from "@/types/forms";

export function useMultiStepForm(config: FormConfig) {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm({
    defaultValues: config.initialValues,
    onSubmit: config.onSubmit,
    validatorAdapter: zodValidator(),
  });

  const nextStep = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return {
    form,
    currentStep,
    currentStepConfig: config.steps[currentStep],
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === config.steps.length - 1,
    nextStep,
    previousStep,
  };
}
