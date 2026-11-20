import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, PlusCircle, ChevronDown, Scale } from 'lucide-react';

const DietTracker = () => {
  const [meals, setMeals] = useState({});
  const [showSuggestions, setShowSuggestions] = useState('');
  const [dietGoal, setDietGoal] = useState('maintain');
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  const dietGoals = {
    gain: {
      name: 'Weight Gain',
      description: 'High-protein, calorie-surplus diet',
      calorieAdjustment: '+500 calories/day',
      focus: 'Emphasis on protein-rich foods and healthy fats'
    },
    lose: {
      name: 'Weight Loss',
      description: 'Calorie-deficit with high protein',
      calorieAdjustment: '-500 calories/day',
      focus: 'High protein, low carb, rich in fiber'
    },
    maintain: {
      name: 'Maintain Weight',
      description: 'Balanced nutrition',
      calorieAdjustment: 'Maintenance calories',
      focus: 'Balanced macronutrients'
    }
  };

  // Food suggestions organized by goal and meal type
  const foodSuggestions = {
    gain: {
      Breakfast: {
        'High-Calorie Proteins': ['Whole eggs with cheese', 'Protein smoothie with oats', 'Full-fat Greek yogurt', 'Protein pancakes'],
        'Calorie-Dense Carbs': ['Bagels with cream cheese', 'Granola with nuts', 'Oatmeal with peanut butter', 'Whole grain waffles'],
        'Healthy Fats': ['Avocado toast', 'Almond butter', 'Full-fat milk', 'Trail mix'],
        'Fruits': ['Banana with honey', 'Dried fruits', 'Mango smoothie', 'Date and nut bars']
      },
      Lunch: {
        'Proteins': ['Double chicken breast', 'Salmon with sauce', 'Beef stir-fry', 'Tuna pasta'],
        'Carbs': ['Brown rice (large portion)', 'Sweet potato wedges', 'Whole grain pasta', 'Quinoa bowl'],
        'Healthy Fats': ['Olive oil dressing', 'Avocado', 'Nuts and seeds', 'Full-fat dips'],
        'Sides': ['Roasted vegetables in oil', 'Chickpea salad', 'Corn on the cob', 'Bean mix']
      },
      Dinner: {
        'Proteins': ['Steak', 'Whole chicken leg', 'Salmon fillet', 'Protein shake'],
        'Carbs': ['Mashed potatoes', 'Rice pilaf', 'Pasta with sauce', 'Loaded sweet potato'],
        'Extras': ['Protein bars', 'Mass gainer shake', 'Nut butter sandwich', 'Protein cookies']
      }
    },
    lose: {
      Breakfast: {
        'Lean Proteins': ['Egg whites', 'Low-fat Greek yogurt', 'Turkey bacon', 'Protein shake'],
        'Complex Carbs': ['Steel-cut oats', 'Whole grain toast', 'Quinoa porridge', 'Low-fat granola'],
        'Low-Cal Fruits': ['Berries', 'Apple', 'Grapefruit', 'Melon'],
        'Healthy Fats': ['Small portion nuts', 'Chia seeds', 'Light spread', 'Hemp seeds']
      },
      Lunch: {
        'Lean Proteins': ['Grilled chicken breast', 'Tuna in water', 'Tofu', 'Turkey slices'],
        'Vegetables': ['Large green salad', 'Steamed broccoli', 'Roasted vegetables', 'Spinach'],
        'Light Carbs': ['Quinoa (small portion)', 'Brown rice cup', 'Butternut squash', 'Lentils'],
        'Healthy Fats': ['Light dressing', 'Small avocado', 'Olive oil spray', 'Sunflower seeds']
      },
      Dinner: {
        'Proteins': ['White fish', 'Lean beef', 'Chicken breast', 'Egg white omelet'],
        'Vegetables': ['Zucchini noodles', 'Cauliflower rice', 'Green beans', 'Brussels sprouts'],
        'Healthy Sides': ['Protein ice cream', 'Sugar-free jello', 'Light yogurt', 'Rice cakes']
      }
    },
    maintain: {
      Breakfast: {
        'Proteins': ['Eggs', 'Greek yogurt', 'Protein oats', 'Cottage cheese'],
        'Carbs': ['Whole grain bread', 'Oatmeal', 'Fruit smoothie', 'Granola'],
        'Fruits': ['Banana', 'Berries mix', 'Apple', 'Orange'],
        'Healthy Fats': ['Avocado', 'Nuts', 'Seeds', 'Nut butter']
      },
      Lunch: {
        'Proteins': ['Chicken breast', 'Tuna', 'Turkey', 'Chickpeas'],
        'Carbs': ['Brown rice', 'Quinoa', 'Sweet potato', 'Whole grain wrap'],
        'Vegetables': ['Mixed salad', 'Roasted vegetables', 'Steamed greens', 'Raw veggies'],
        'Healthy Fats': ['Olive oil', 'Avocado', 'Nuts', 'Seeds']
      },
      Dinner: {
        'Proteins': ['Fish', 'Lean meat', 'Tofu', 'Legumes'],
        'Carbs': ['Potato', 'Rice', 'Pasta', 'Couscous'],
        'Balanced Sides': ['Fruit', 'Yogurt', 'Small dessert', 'Nuts']
      }
    }
  };

  const handleMealChange = (day, mealType, value) => {
    setMeals(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [mealType]: value
      }
    }));
  };

  const addSuggestionToMeal = (day, mealType, suggestion) => {
    const currentMeal = meals[day]?.[mealType] || '';
    const newMeal = currentMeal ? `${currentMeal}, ${suggestion}` : suggestion;
    handleMealChange(day, mealType, newMeal);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <CardTitle className="flex justify-between items-center">
          <span>Weekly Diet Planner</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              <select 
                value={dietGoal}
                onChange={(e) => setDietGoal(e.target.value)}
                className="border rounded-md px-3 py-1"
              >
                <option value="maintain">Maintain Weight</option>
                <option value="lose">Lose Weight</option>
                <option value="gain">Gain Weight</option>
              </select>
            </div>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              <Save className="w-4 h-4" />
              Save Plan
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">{dietGoals[dietGoal].name}</h3>
          <p className="text-blue-600">{dietGoals[dietGoal].description}</p>
          <p className="text-blue-600">Daily adjustment: {dietGoals[dietGoal].calorieAdjustment}</p>
          <p className="text-blue-600">Focus: {dietGoals[dietGoal].focus}</p>
        </div>
        <div className="space-y-6">
          {daysOfWeek.map(day => (
            <div key={day} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">{day}</h3>
              <div className="space-y-4">
                {mealTypes.map(mealType => (
                  <div key={mealType} className="space-y-2">
                    <div className="flex items-start gap-4">
                      <div className="w-24 font-medium">{mealType}</div>
                      <div className="flex-1">
                        <textarea
                          className="w-full p-2 border rounded-md min-h-[60px]"
                          placeholder={`Enter ${mealType.toLowerCase()} details...`}
                          value={meals[day]?.[mealType] || ''}
                          onChange={(e) => handleMealChange(day, mealType, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="ml-24">
                      <button
                        className="text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
                        onClick={() => setShowSuggestions(showSuggestions === `${day}-${mealType}` ? '' : `${day}-${mealType}`)}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Show food suggestions
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showSuggestions === `${day}-${mealType}` && (
                        <div className="mt-2 bg-gray-50 p-3 rounded-md">
                          {Object.entries(foodSuggestions[dietGoal][mealType]).map(([category, foods]) => (
                            <div key={category} className="mb-2">
                              <h4 className="font-medium text-sm text-gray-700 mb-1">{category}</h4>
                              <div className="flex flex-wrap gap-2">
                                {foods.map(food => (
                                  <button
                                    key={food}
                                    onClick={() => addSuggestionToMeal(day, mealType, food)}
                                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-100"
                                  >
                                    {food}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DietTracker;