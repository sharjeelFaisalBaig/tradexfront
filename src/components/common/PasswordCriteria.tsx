import { CheckCircle, Dot, XCircle } from "lucide-react";

interface PasswordCriteriaProps {
  password: string;
}

const PasswordCriteria = ({ password }: PasswordCriteriaProps) => {
  const criteria = [
    {
      label: "At least 8 characters",
      isValid: password.length >= 8,
    },
    {
      label: "At least one uppercase letter (A–Z)",
      isValid: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter (a–z)",
      isValid: /[a-z]/.test(password),
    },
    {
      label: "At least one number (0–9)",
      isValid: /\d/.test(password),
    },
    {
      label: "At least one special character (@$!%*?&)",
      isValid: /[@$!%*?&]/.test(password),
    },
  ];

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-700">
        Password must include:
      </p>
      <ul className="text-sm text-gray-600 space-y-1">
        {criteria.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              //   <XCircle className="w-4 h-4 text-red-500" />
              <CheckCircle className="w-4 h-4" />
            )}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordCriteria;
