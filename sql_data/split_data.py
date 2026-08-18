import os

source_file = "webhoatuoidb_data.sql"
output_dir = "split_tables"
os.makedirs(output_dir, exist_ok=True)

with open(source_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

splits = [
    ("01_AspNetRoles.sql", 5, 9),
    ("02_AspNetUsers.sql", 9, 311),
    ("03_AspNetUserRoles.sql", 311, 323),
    ("04_Categories.sql", 323, 378),
    ("05_Products.sql", 378, 433),
    ("06_Orders.sql", 433, 1438),
    ("07_OrderItems.sql", 1438, 2444),
    ("08_Reviews.sql", 2444, 2649),
    ("09_SystemSettings.sql", 2649, 2658),
    ("10_Vouchers.sql", 2658, 2663),
    ("11_BlogPosts.sql", 2663, 2669)
]

for filename, start, end in splits:
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as out:
        # Use database name without USE [WebHoaTuoiDb] to make it database-name independent on Somee
        out.write("-- File: " + filename + "\n\n")
        out.writelines(lines[start:end])
    print(f"Created {filename} with {end-start} lines.")
