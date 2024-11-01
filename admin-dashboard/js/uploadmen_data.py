import requests
menu_data = [
  {
    "name": "The American breakfast 1",
    "price": 13500,
    "menu_id": 2,
    "subcategory": "Early bird Grubs"
  },
  {
    "name": "The American breakfast 2",
    "price": 19500,
    "menu_id": 2,
    "subcategory": "Early bird Grubs"
  },
  {
    "name": "The English breakfast",
    "price": 15500,
    "menu_id": 2,
    "subcategory": "Early bird Grubs"
  },
  {
    "name": "Nigerian breakfast 1",
    "price": 9500,
    "menu_id": 2,
    "subcategory": "Early bird Grubs"
  },
  {
    "name": "Nigerian breakfast 2",
    "price": 8000,
    "menu_id": 2,
    "subcategory": "Early bird Grubs"
  },
  {
    "name": "Pain perdu toast and berry sauce",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Early bird Grubs"
  },
  {
    "name": "Chicken pesto sandwich",
    "price": 18500,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "The bean panini",
    "price": 5000,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "Breakfast burrito",
    "price": 15500,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "The Grub crepe wrap",
    "price": 13000,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "Avocado sandwich",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "The all-in-one breakfast bun",
    "price": 19500,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "Tuna mayo toastie",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "The Grub club served with side mixed salad and fries",
    "price": 15500,
    "menu_id": 2,
    "subcategory": "Sandwiches, Toasties And Wraps"
  },
  {
    "name": "Pain au chocolat",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Scones",
    "price": 2000,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Croissant",
    "price": 3000,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Nigerian buns",
    "price": 1200,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Chocolate chip cookies",
    "price": 2000,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Cinnamon rolls",
    "price": 3000,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Chocolate muffins",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Blueberry muffins",
    "price": 3000,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Oat banana muffins",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Tea and Coffee Accompainments"
  },
  {
    "name": "Philly cheese steak loaded fries",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Tostones and mayo-garlic dip",
    "price": 5500,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Lemony shrimp bruschetta",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Prawn alla busara",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Chicken wings",
    "price": 15750,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Feast for all",
    "price": 110000,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Tacos",
    "price": 11500,
    "menu_id": 2,
    "subcategory": "Appetizers"
  },
  {
    "name": "Fish pepper soup",
    "price": 10500,
    "menu_id": 2,
    "subcategory": "Soups"
  },
  {
    "name": "Seafood chowder",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Soups"
  },
  {
    "name": "Goat meat pepper soup",
    "price": 12500,
    "menu_id": 2,
    "subcategory": "Soups"
  },
  {
    "name": "Carrot and coriander soup",
    "price": 8000,
    "menu_id": 2,
    "subcategory": "Soups"
  },
  {
    "name": "Tomato and basil soup",
    "price": 8000,
    "menu_id": 2,
    "subcategory": "Soups"
  },
  {
    "name": "Sweet corn soup",
    "price": 8000,
    "menu_id": 2,
    "subcategory": "Soups"
  },
  {
    "name": "Panzanella",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Creamy pasta salad",
    "price": 13500,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Caesar salad",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Caesar salad with grilled chicken",
    "price": 19000,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Mixed salad",
    "price": 7500,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Fruit salad",
    "price": 10750,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Salad nicoise",
    "price": 19500,
    "menu_id": 2,
    "subcategory": "Salads"
  },
  {
    "name": "Linguine Alfredo",
    "price": 13500,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Linguine Alfredo with chicken",
    "price": 20500,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Linguine Alfredo with shrimp",
    "price": 23500,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Beef Lasagna",
    "price": 18000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Penne arrabbiata",
    "price": 18500,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Penne arrabbiata with prawns",
    "price": 25000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Spaghetti Bolognaise",
    "price": 14500,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Sweet and sour chicken served with basmati rice",
    "price": 22000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Shredded beef in oyster sauce served with basmati rice",
    "price": 22000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Pan fried chicken breast, gremolata crumb and Risotto alla Milanese",
    "price": 30000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Nigerian smoky jollof rice served with fried plantains and ¼ spicy chicken",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Hake Kedegeree with yogurt drizzle",
    "price": 25000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Jambalaya rice and Cajun buttered corn on the cob",
    "price": 18000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Chilli corne carne, corn bread and spiced butter",
    "price": 29000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Teriyaki salmon (250g) with Mango, corn and lime salsa coconut rice",
    "price": 43000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Sunday roast",
    "price": 14000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Spicy lamb chops, flatbreads, moutabal and pickled red onions",
    "price": 33000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Battered fish and chips served with coleslaw and tartar sauce",
    "price": 18500,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Mashed potatoes, Charred sweet corn, gravy, Sirloin Steak (250g) and chimichurri sauce",
    "price": 40000,
    "menu_id": 2,
    "subcategory": "Mains"
  },
  {
    "name": "Chicken mac and cheese",
    "price": 11500,
    "menu_id": 2,
    "subcategory": "The Young Grubber"
  },
  {
    "name": "Fish fingers and fries",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "The Young Grubber"
  },
  {
    "name": "Mini pancakes, scrambled eggs and sausages",
    "price": 15500,
    "menu_id": 2,
    "subcategory": "The Young Grubber"
  },
  {
    "name": "Hot dogs and fries",
    "price": 7500,
    "menu_id": 2,
    "subcategory": "The Young Grubber"
  },
  {
    "name": "Chicken nuggets and fries",
    "price": 7500,
    "menu_id": 2,
    "subcategory": "The Young Grubber"
  },
  {
    "name": "Spaghetti and meatballs",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "The Young Grubber"
  },
  {
    "name": "Crispy chicken burger served with fries",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Burgers"
  },
  {
    "name": "Battered fish burger and fries",
    "price": 18500,
    "menu_id": 2,
    "subcategory": "Burgers"
  },
  {
    "name": "The Grub burger served with fries",
    "price": 19500,
    "menu_id": 2,
    "subcategory": "Burgers"
  },
  {
    "name": "Oat pancakes or oat waffles",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Yoghurt parfait",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "The wholesome breakfast",
    "price": 13500,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Grilled plantains and spicy omelettes served with tomato sauce",
    "price": 9500,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Smoothie bowl",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "The Bean Panini",
    "price": 7000,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Mixed vegetable bulgur served with garlic and herb chicken thigh and mixed side salad",
    "price": 18500,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Jollof bulgur served with grilled ¼ chicken and roasted plantain slices",
    "price": 18500,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Sweet potatoes and omelettes served with Nigerian style tomato sauce",
    "price": 8000,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Skinny alfredo served with whole wheat garlic bread with Chicken",
    "price": 20500,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Skinny alfredo served with whole wheat garlic bread with Shrimp",
    "price": 25500,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Baked parsley potatoes and pan seared fish served with a side mixed salad and tartar sauce",
    "price": 45000,
    "menu_id": 2,
    "subcategory": "The Fit Grubber"
  },
  {
    "name": "Pepperoni",
    "price": 18000,
    "menu_id": 2,
    "subcategory": "Pizza"
  },
  {
    "name": "Meat-feast",
    "price": 17000,
    "menu_id": 2,
    "subcategory": "Pizza"
  },
  {
    "name": "Cheese and tomato",
    "price": 13500,
    "menu_id": 2,
    "subcategory": "Pizza"
  },
  {
    "name": "Veg-feast",
    "price": 16000,
    "menu_id": 2,
    "subcategory": "Pizza"
  },
  {
    "name": "Chicken pie",
    "price": 2000,
    "menu_id": 2,
    "subcategory": "Savoury Pastry"
  },
  {
    "name": "Mushroom pie",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Savoury Pastry"
  },
  {
    "name": "Steak pie",
    "price": 2000,
    "menu_id": 2,
    "subcategory": "Savoury Pastry"
  },
  {
    "name": "Beef sausage rolls",
    "price": 1500,
    "menu_id": 2,
    "subcategory": "Savoury Pastry"
  },
  {
    "name": "Apple crumble and custard",
    "price": 7500,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Chocolate fudge",
    "price": 5500,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Berry crumble and custard",
    "price": 8000,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Waffle and ice cream",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Grub-Sert",
    "price": 11500,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Victoria sponge",
    "price": 5000,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Carrot cake",
    "price": 7500,
    "menu_id": 2,
    "subcategory": "Dessert"
  },
  {
    "name": "Oreo milkshake",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Kitkat milkshake",
    "price": 10500,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Twix milkshake",
    "price": 10500,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Bounty milkshake",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Vanilla milkshake",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Mars milkshake",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "M&M's milkshake",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Marshmallow milkshake",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Snickers milkshake",
    "price": 8500,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Boozy milkshake (Baileys and ice cream)",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Skittles milkshake",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Maltesers milkshake",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Strawberry milkshake",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Ferrero rocher milkshake",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Banana milkshake",
    "price": 6000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Dairy milk milkshake",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Milkshake"
  },
  {
    "name": "Cappuccino",
    "price": 5000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Caffé Latte",
    "price": 5000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Americano",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Iced coffee",
    "price": 5500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Hot chocolate",
    "price": 5000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Espresso",
    "price": 3000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Caffé mocha",
    "price": 5500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Decaf green tea",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Black tea",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Pure green tea",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Hibiscus tea",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Camomile tea",
    "price": 3500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Decaf black tea",
    "price": 3000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Watermelon and cucumber juice",
    "price": 7500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Pineapple juice",
    "price": 7000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Fresh orange juice",
    "price": 7000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Hibiscus juice",
    "price": 5000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Green smoothie",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Power protein smoothie",
    "price": 15000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Strawberry-banana smoothie",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Green goodness",
    "price": 8500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Virgin pina colada",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Apple, elderflower and mint",
    "price": 12000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Virgin mojito",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Pineapple and vanilla iced tea",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Strawberry lemonade",
    "price": 11000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Classic Shirley Temple",
    "price": 11000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Coca-cola",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Sprite",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Fanta",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Maltina",
    "price": 3000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Soda water",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Tonic water",
    "price": 2500,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Big Still water",
    "price": 4000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Small still water",
    "price": 2000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "A glass of packed orange or apple juice",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "A glass of packed cranberry juice",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Non-Alcoholic Beverages"
  },
  {
    "name": "Sex on the beach",
    "price": 11000,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Pina colada",
    "price": 11000,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Mojito",
    "price": 10000,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Classic Shandy",
    "price": 9000,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Strawberry dark daiquiri",
    "price": 11000,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Star",
    "price": 4200,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Heineken",
    "price": 4500,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Budweiser",
    "price": 4500,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Guinness",
    "price": 4800,
    "menu_id": 2,
    "subcategory": "Alcoholic Beverages"
  },
  {
    "name": "Martini asti spumante",
    "price": 25000,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Martini sparkling rose",
    "price": 25000,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Moet et Chandon",
    "price": 255000,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Veuve Cliqot",
    "price": 355000,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Grub wine glass (sweet or dry)",
    "price": 6500,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Santa Christina Antinori (Italy: 2020)",
    "price": 58000,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Haussman Baron Eugène bordeaux blanc (France, 2020)",
    "price": 40500,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Grub wine glass (sweet or dry)",
    "price": 6500,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Shiraz Nederburg (South Africa, 2020)",
    "price": 52000,
    "menu_id": 2,
    "subcategory": "Wine"
  },
  {
    "name": "Individo Merlot - Cabernet Sauvignon (France, 2021)",
    "price": 50000,
    "menu_id": 2,
    "subcategory": "Wine"
  }
]

URL_ENDPOINT="https://grublanerestaurant.com/api/dish/createDish"

def upload_menu_to_endpoint(menu):
    try:
        
        for item in menu:
            payload = {
                "name": item["name"],
                "price": item["price"],
                "menu_id": item["menu_id"],
                "subcategory": item["subcategory"],

            }
            response=requests.post(URL_ENDPOINT,json=payload

            )
            if response.status_code ==201:
                print(f"{item["name"]} has been uploaded")
            print(f"{item["name"]}failed")
            print(response.json())

    except:
        raise ValueError(" Failed to upload menu")
    

upload_menu_to_endpoint(menu_data)