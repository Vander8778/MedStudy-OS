import { CONTRACT_RULE_DEFINITIONS } from "./rule-definitions";
import type {
  ContractEvaluationResult,
  ContractRuleEvaluationInput,
  ContractRuleResult
} from "./types";

export function evaluateContractRules(
  input: ContractRuleEvaluationInput
): ContractEvaluationResult {
  const rules = CONTRACT_RULE_DEFINITIONS.map((definition) =>
    definition.evaluate(input)
  );

  const criticalViolations = rules.filter(
    (rule): rule is ContractRuleResult =>
      rule.passed === false && rule.severity === "critical"
  );
  const warnings = rules.filter(
    (rule): rule is ContractRuleResult =>
      rule.passed === false && rule.severity === "warning"
  );
  const informational = rules.filter(
    (rule): rule is ContractRuleResult => rule.severity === "info"
  );

  return {
    allRulesPassed: rules.every((rule) => rule.passed),
    hasCriticalViolation: criticalViolations.length > 0,
    rules,
    criticalViolations,
    warnings,
    informational
  };
}
