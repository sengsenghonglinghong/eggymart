# Database Setup Instructions

## Problem
The cart and favorites functionality is not working because the required database tables don't exist yet.

## Solution
You need to run the SQL script to create the missing tables.

## Steps to Fix:

### Option 1: Using MySQL Command Line
1. Open Command Prompt or PowerShell as Administrator
2. Navigate to your project directory:
   ```bash
   cd "C:\Users\suereed\Downloads\egg incubator\egg-chick-store"
   ```
3. Run the SQL script:
   ```bash
   mysql -u root -p < db/add_cart_favorites_tables.sql
   ```

### Option 2: Using MySQL Workbench or phpMyAdmin
1. Open MySQL Workbench or phpMyAdmin
2. Connect to your MySQL server
3. Select the `eggmart` database
4. Run the SQL commands from `db/add_cart_favorites_tables.sql`

### Option 3: Using XAMPP/WAMP Control Panel
1. Open XAMPP/WAMP Control Panel
2. Start MySQL service
3. Open phpMyAdmin
4. Select the `eggmart` database
5. Go to SQL tab
6. Copy and paste the contents of `db/add_cart_favorites_tables.sql`
7. Click "Go" to execute

## What the script does:
- Creates `cart_items` table for shopping cart functionality
- Creates `favorites` table for user favorites
- Sets up proper foreign key relationships
- Adds necessary indexes for performance

## After running the script:
1. Restart your Next.js development server
2. Test the add to cart and favorites functionality
3. The buy now modal should work properly

## Verification:
You can verify the tables were created by running:
```sql
SHOW TABLES;
```
You should see `cart_items` and `favorites` in the list.











