import { action, makeObservable, observable } from 'mobx';

import { StepperConfig } from './model.types.js';

export class Stepper<StepData> {
  activeStepIndex = 0;

  steps: StepData[] = [];

  get activeStep() {
    return this.steps[this.activeStepIndex];
  }

  constructor({ steps = [] }: StepperConfig<StepData>) {
    this.steps = steps;

    observable(this, 'activeStepIndex');
    observable(this, 'steps');
    action.bound(this, 'setSteps');
    action.bound(this, 'goToStep');
    action.bound(this, 'nextStep');
    action.bound(this, 'prevStep');

    makeObservable(this);
  }

  setSteps(steps: StepData[]) {
    this.steps = steps;
  }

  goToStep(nextStepIndex: number) {
    this.activeStepIndex = Math.max(
      0,
      Math.min(nextStepIndex, this.steps.length - 1),
    );
  }

  nextStep() {
    this.goToStep(this.activeStepIndex + 1);
  }

  prevStep() {
    this.goToStep(this.activeStepIndex - 1);
  }

  checkStepCompleted(stepIndex: number) {
    return this.activeStepIndex > stepIndex;
  }

  get isNextStepLast() {
    return this.steps.length - 1 === this.activeStepIndex + 1;
  }

  get isLastStep() {
    return this.steps.length - 1 === this.activeStepIndex;
  }

  get hasPrevStep() {
    return this.activeStepIndex !== 0;
  }
}

export const createStepper = /*#__PURE__*/ <StepData>(
  config: StepperConfig<StepData>,
) => new Stepper(config);
