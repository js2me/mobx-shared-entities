import { action, makeObservable, observable } from 'mobx';

export class MobxStepper<StepData> {
  activeStepIndex = 0;

  steps: StepData[] = [];

  get activeStep() {
    return this.steps[this.activeStepIndex];
  }

  constructor({ steps = [] }: { steps?: StepData[] }) {
    this.steps = steps;

    makeObservable(this, {
      activeStepIndex: observable,
      steps: observable,
      goToStep: action.bound,
      nextStep: action.bound,
      prevStep: action.bound,
    });
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
