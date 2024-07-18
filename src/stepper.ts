import { action, observable } from 'mobx';

export class Stepper<StepData> {
  @observable
  accessor activeStepIndex = 0;

  @observable
  accessor steps: StepData[] = [];

  get activeStep() {
    return this.steps[this.activeStepIndex];
  }

  constructor({ steps = [] }: { steps?: StepData[] }) {
    this.steps = steps;
  }

  @action.bound
  goToStep(nextStepIndex: number) {
    this.activeStepIndex = Math.max(
      0,
      Math.min(nextStepIndex, this.steps.length - 1),
    );
  }

  @action.bound
  nextStep() {
    this.goToStep(this.activeStepIndex + 1);
  }

  @action.bound
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
