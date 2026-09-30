$env:PRISMA_MIGRATE_SKIP_GENERATE = "1"
$input = "y`n"
$input | npx prisma migrate dev --name add_user_lifecycle_product_youtube_auditlog 2>&1
