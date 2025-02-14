import React from 'react'

export function StepIndicator({ steps, currentStep }: { steps: StepData[]; currentStep: number }) {
  return (
    <div className='flex space-x-2 mb-4'>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        return (
          <div
            key={index}
            className={`px-3 py-2 rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {step.title || `Step ${index + 1}`}
          </div>
        )
      })}
    </div>
  )
}

export function StepLayout({
  children,
  title,
  showIndicator,
  steps,
  currentStep,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  fullScreen,
}: {
  children: React.ReactNode
  title?: string
  showIndicator: boolean
  steps: StepData[]
  currentStep: number
  onPrev?: () => void
  onNext?: () => void
  prevLabel: string
  nextLabel: string
  fullScreen?: boolean
}) {
  const containerClass = fullScreen ? 'flex flex-col h-screen overflow-hidden' : 'p-4'
  const contentClass = fullScreen ? 'flex-1 overflow-auto p-4' : 'mb-4'
  const canGoPrev = currentStep > 0
  const canGoNext = currentStep < steps.length
  return (
    <div className={containerClass}>
      {showIndicator && <StepIndicator steps={steps} currentStep={currentStep} />}
      {title && <h2 className='text-xl font-semibold mb-4'>{title}</h2>}
      <div className={contentClass}>{children}</div>
      <div className='flex justify-between'>
        {canGoPrev ? (
          <button onClick={onPrev} className='bg-gray-300 px-4 py-2 rounded hover:bg-gray-400'>
            {prevLabel}
          </button>
        ) : (
          <div />
        )}
        {canGoNext && (
          <button onClick={onNext} className='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700'>
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export interface StepData {
  title?: string
  component: React.ReactNode
  validate?: () => boolean | Promise<boolean>
  nextLabel?: string
  prevLabel?: string
}

export interface StepNavigatorProps {
  steps: StepData[]
  currentStep: number
  onStepChange: (stepIndex: number) => void
  showStepIndicator?: boolean
  fullScreen?: boolean
  defaultNextLabel?: string
  defaultPrevLabel?: string
  defaultNextLabelLastStep?: string
}

export function StepNavigator({
  steps,
  currentStep,
  onStepChange,
  showStepIndicator = true,
  fullScreen = false,
  defaultNextLabel = 'Seuraava',
  defaultPrevLabel = 'Edellinen',
  defaultNextLabelLastStep = 'OK',
}: StepNavigatorProps) {
  const handleNext = async () => {
    if (currentStep < 0 || currentStep >= steps.length) return
    const step = steps[currentStep]
    if (step.validate) {
      const isValid = await Promise.resolve(step.validate())
      if (!isValid) return
    }
    onStepChange(currentStep + 1)
  }
  const handlePrev = () => {
    if (currentStep > 0) onStepChange(currentStep - 1)
  }
  const isLastStep = currentStep === steps.length - 1 && steps.length > 0
  const prevLabel = steps[currentStep]?.prevLabel ?? defaultPrevLabel
  const nextLabel = steps[currentStep]?.nextLabel ?? (isLastStep ? defaultNextLabelLastStep : defaultNextLabel)
  const currentStepData = steps[currentStep] || {}
  const StepContent = currentStepData.component
  return (
    <StepLayout
      showIndicator={showStepIndicator}
      steps={steps}
      currentStep={currentStep}
      title={currentStepData.title}
      onPrev={handlePrev}
      onNext={handleNext}
      prevLabel={prevLabel}
      nextLabel={nextLabel}
      fullScreen={fullScreen}
    >
      {StepContent}
    </StepLayout>
  )
}
