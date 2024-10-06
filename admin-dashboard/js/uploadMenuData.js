const API_CREATE_URL = "https://grublanerestaurant.com/api/dish/createDish";

const menuData = [
  [
    {
      name: "The American breakfast 1",
      description:
        "4 pancakes, 3 scrambled eggs, 2 sausages, 2 streaks of bacon, hash browns",
      price: 13500,
      servicetype: "dine-in",
      subcategory: "Early bird Grubs",
    },
    {
      name: "Caesar Salad",
      description:
        "Made with iceberg lettuce, croutons, parmesan cheese, and Caesar dressing",
      price: 15000,
      servicetype: "dine-in",
      subcategory: "Salads",
    },
    {
      name: "Caesar Salad with grilled chicken",
      price: 19000,
      servicetype: "dine-in",
      subcategory: "Salads",
    },
    {
      name: "Panzanella",
      description:
        "Made with marinated bread, tomatoes, vinegar, and cucumbers",
      price: 12000,
      servicetype: "dine-in",
      subcategory: "Salads",
    },
    {
      name: "Linguine Alfredo",
      description:
        "This dish is made with linguine pasta tossed in a rich creamy cheese sauce",
      price: 13500,
      servicetype: "dine-in",
      subcategory: "Pasta",
    },
    {
      name: "Linguine Alfredo with shrimp",
      price: 23500,
      servicetype: "dine-in",
      subcategory: "Pasta",
    },
    {
      name: "Sweet and sour chicken served with basmati rice",
      description:
        "Hong Kong style dish made with crispy chicken pieces coated in sweet and sour sauce",
      price: 22000,
      servicetype: "dine-in",
      subcategory: "Rice",
    },
    {
      name: "Pan fried chicken breast, gremolata crumb and Risotto alla Milanese",
      description:
        "Creamy saffron risotto topped with savory and crunchy gremolata crumb",
      price: 30000,
      servicetype: "dine-in",
      subcategory: "Rice",
    },
    {
      name: "Mini pancakes, scrambled eggs and sausages",
      price: 15500,
      servicetype: "dine-in",
      subcategory: "Kids Menu",
    },
    {
      name: "Chicken mac and cheese",
      price: 11500,
      servicetype: "dine-in",
      subcategory: "Kids Menu",
    },
    {
      name: "Crispy chicken burger served with fries",
      description:
        "Made with grub buns, crispy chicken breast, lettuce and tomatoes",
      price: 15000,
      servicetype: "dine-in",
      subcategory: "Burgers",
    },
    {
      name: "The Grub burger served with fries",
      description:
        "Made with Grub made buns, Grub made beef patty, cheese, tomato, onions, lettuce, pickles, coleslaw and burger sauce",
      price: 19500,
      servicetype: "dine-in",
      subcategory: "Burgers",
    },
    {
      name: "The wholesome breakfast",
      description:
        "Porridge oats served with low fat milk, 2 scrambled eggs, fruit salad, and date syrup or honey",
      price: 13500,
      servicetype: "dine-in",
      subcategory: "Weightwatchers Menu",
    },
    {
      name: "Oat pancakes or Oat waffles",
      description:
        "4 fluffy pancakes or waffles made from oat powder and served with low fat yoghurt apple slices",
      price: 10000,
      servicetype: "dine-in",
      subcategory: "Weightwatchers Menu",
    },
    {
      name: "Cheese and Tomato Pizza",
      description: "Tomato sauce topped with mozzarella cheese",
      price: 13500,
      servicetype: "dine-in",
      subcategory: "Pizza",
    },
    {
      name: "Pepperoni Pizza",
      description: "Tomato sauce, mozzarella and beef pepperoni",
      price: 18000,
      servicetype: "dine-in",
      subcategory: "Pizza",
    },
    {
      name: "Beef Sausage Rolls",
      price: 1500,
      servicetype: "dine-in",
      subcategory: "Savoury Pastry",
    },
    {
      name: "Chicken Pie",
      price: 2000,
      servicetype: "dine-in",
      subcategory: "Savoury Pastry",
    },
    {
      name: "Apple Crumble and Custard",
      description:
        "Layers of apple filling, vanilla custard and shortbread crumble",
      price: 7500,
      servicetype: "dine-in",
      subcategory: "Dessert",
    },
    {
      name: "Chocolate Fudge Cake",
      description:
        "Super moist chocolate cake with layers of rich chocolate fudge frosting",
      price: 5500,
      servicetype: "dine-in",
      subcategory: "Dessert",
    },
    {
      name: "Oreo Milkshake",
      price: 12000,
      servicetype: "dine-in",
      subcategory: "Milkshakes",
    },
    {
      name: "Vanilla Milkshake",
      price: 9000,
      servicetype: "dine-in",
      subcategory: "Milkshakes",
    },
    {
      name: "Caffe Latte",
      price: 5000,
      servicetype: "dine-in",
      subcategory: "Non-alcoholic Beverages",
    },
    {
      name: "Espresso",
      price: 3000,
      servicetype: "dine-in",
      subcategory: "Non-alcoholic Beverages",
    },
    {
      name: "Strawberry Lemonade",
      price: 11000,
      servicetype: "dine-in",
      subcategory: "Mocktails",
    },
    {
      name: "Virgin Mojito",
      price: 9000,
      servicetype: "dine-in",
      subcategory: "Mocktails",
    },
    {
      name: "Mojito",
      price: 10000,
      servicetype: "dine-in",
      subcategory: "Cocktails",
    },
    {
      name: "Sex on the Beach",
      price: 11000,
      servicetype: "dine-in",
      subcategory: "Cocktails",
    },
    {
      name: "Martini Asti Spumante",
      price: 25000,
      servicetype: "dine-in",
      subcategory: "Wines",
    },
    {
      name: "Martini Sparkling Rose",
      price: 25000,
      servicetype: "dine-in",
      subcategory: "Wines",
    },
  ],
];

// Function to create a dish in the API
async function createDish(dish) {
  const formData = new FormData();
  formData.append("name", dish.name);
  formData.append("description", dish.description || "");
  formData.append("price", dish.price);
  formData.append("servicetype", dish.servicetype);
  formData.append("subcategory", dish.subcategory);
  formData.append("menu_id", dish.menu_id);
  formData.append("image", dish.image_link); // Assuming the API accepts image URLs

  try {
    const response = await fetch(API_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to create dish: ${dish.name}`, errorData);
    } else {
      console.log(`Successfully created dish: ${dish.name}`);
    }
  } catch (error) {
    console.error(`Error creating dish: ${dish.name}`, error);
  }
}

async function uploadMenuData() {
  for (const dish of menuData) {
    await createDish(dish); // Create each dish
  }
  console.log("Menu upload complete!");
}

uploadMenuData();
