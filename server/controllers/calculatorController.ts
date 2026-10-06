import { Request, Response } from 'express';

export const calculatorController = {
  /**
   * Public BMI & Metabolic Calculator Endpoint (Available to all, including Guests)
   * Calculates BMI, WHO weight category, healthy target weight boundaries,
   * Mifflin-St Jeor Basal Metabolic Rate (BMR), and fitness guidance.
   */
  calculateBmi(req: Request, res: Response): void {
    try {
      const { weightKg, heightCm, age, gender, activityLevel } = req.body;

      if (!weightKg || !heightCm) {
        res.status(400).json({
          success: false,
          error: 'weightKg and heightCm are required parameters for BMI calculation.',
          code: 'PARAMS_MISSING',
        });
        return;
      }

      const w = Number(weightKg);
      const h = Number(heightCm);
      const a = age ? Number(age) : 28;
      const g = (gender || 'male').toLowerCase();

      if (isNaN(w) || isNaN(h) || w <= 20 || w > 350 || h <= 50 || h > 260) {
        res.status(400).json({
          success: false,
          error: 'Please provide realistic physiological values (weight between 20-350 kg, height between 50-260 cm).',
          code: 'OUT_OF_BOUNDS',
        });
        return;
      }

      const heightM = h / 100;
      const bmi = Math.round((w / (heightM * heightM)) * 10) / 10;

      // Determine WHO BMI category
      let category = 'Normal weight';
      let riskLevel = 'Low risk';
      let healthRecommendations: string[] = [];

      if (bmi < 18.5) {
        category = 'Underweight';
        riskLevel = 'Risk of nutritional deficiency and decreased muscle mass';
        healthRecommendations = [
          'Focus on a caloric surplus with nutrient-dense foods (nuts, whole grains, lean meats).',
          'Prioritize resistance training to stimulate lean muscle hypertrophy.',
          'Aim for 1.6 - 2.0g of protein per kg of body weight.',
        ];
      } else if (bmi >= 18.5 && bmi < 24.9) {
        category = 'Normal weight';
        riskLevel = 'Lowest health risk range';
        healthRecommendations = [
          'Maintain balanced macronutrient distribution (40% carbs, 30% protein, 30% healthy fats).',
          'Follow progressive overload strength training 3-5 days per week.',
          'Incorporate cardiovascular conditioning for heart and metabolic health.',
        ];
      } else if (bmi >= 25.0 && bmi < 29.9) {
        category = 'Overweight';
        riskLevel = 'Moderate cardiovascular & metabolic risk';
        healthRecommendations = [
          'Incorporate a moderate caloric deficit (-300 to -500 kcal/day) while preserving protein intake.',
          'Engage in compound resistance movements (squats, deadlifts, presses) to preserve lean tissue.',
          'Increase non-exercise activity thermogenesis (aim for 8,000 - 10,000 steps daily).',
        ];
      } else if (bmi >= 30.0 && bmi < 34.9) {
        category = 'Obese (Class 1)';
        riskLevel = 'Elevated metabolic and cardiovascular risk';
        healthRecommendations = [
          'Consult with a physician or registered dietitian for personalized dietary interventions.',
          'Implement structured caloric restriction with whole foods and high fiber (>30g daily).',
          'Combine low-impact resistance training with progressive walking regimens.',
        ];
      } else {
        category = 'Obese (Class 2 / High)';
        riskLevel = 'High health risk';
        healthRecommendations = [
          'Seek professional medical supervision for structured metabolic and lifestyle guidance.',
          'Focus on sustainable, gradual weight management without crash dieting.',
          'Prioritize joint-friendly resistance and mobility exercises.',
        ];
      }

      // Calculate healthy weight range for normal BMI (18.5 - 24.9)
      const minHealthyWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
      const maxHealthyWeight = Math.round(24.9 * heightM * heightM * 10) / 10;

      // Mifflin-St Jeor formula for BMR
      // Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
      // Women: 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
      let bmr = Math.round(10 * w + 6.25 * h - 5 * a + (g === 'female' ? -161 : 5));

      // Activity multipliers
      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9,
      };
      const multiplier = activityMultipliers[activityLevel?.toLowerCase()] || 1.55;
      const tdee = Math.round(bmr * multiplier);

      res.status(200).json({
        success: true,
        data: {
          bmi,
          category,
          riskLevel,
          metrics: {
            inputWeightKg: w,
            inputHeightCm: h,
            healthyWeightRangeKg: {
              min: minHealthyWeight,
              max: maxHealthyWeight,
            },
            estimatedBmrCalories: bmr,
            estimatedTdeeCalories: tdee,
          },
          caloricGuidelines: {
            fatLossCutting: Math.round(tdee - 450),
            weightMaintenance: tdee,
            leanMuscleBulking: Math.round(tdee + 300),
          },
          recommendations: healthRecommendations,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
