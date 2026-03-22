#!/usr/bin/env bash
# Generates fake Claude session data for VHS recordings.
# Usage: ./vhs/generate-fixtures.sh

set -euo pipefail

FIXTURES_DIR="$(cd "$(dirname "$0")" && pwd)/fixtures"
rm -rf "$FIXTURES_DIR"

create_session() {
  local project_dir="$1"
  local session_id="$2"
  local branch="$3"
  local cwd="$4"
  local days_ago="$5"
  shift 5

  local dir="$FIXTURES_DIR/$project_dir"
  mkdir -p "$dir"
  local file="$dir/$session_id.jsonl"

  > "$file"
  local is_first=true
  while [[ $# -gt 0 ]]; do
    local role="$1"
    local msg="$2"
    shift 2

    if [[ "$role" == "user" ]]; then
      if [[ "$is_first" == "true" ]]; then
        echo "{\"type\":\"user\",\"message\":{\"content\":\"$msg\"},\"gitBranch\":\"$branch\",\"cwd\":\"$cwd\"}" >> "$file"
        is_first=false
      else
        echo "{\"type\":\"user\",\"message\":{\"content\":\"$msg\"},\"gitBranch\":\"$branch\",\"cwd\":\"$cwd\"}" >> "$file"
      fi
    else
      echo "{\"type\":\"assistant\",\"message\":{\"content\":\"$msg\"}}" >> "$file"
    fi
  done

  # Set modification time
  if [[ "$(uname)" == "Darwin" ]]; then
    touch -A "-${days_ago}0000" "$file" 2>/dev/null || touch -t "$(date -v-${days_ago}d +%Y%m%d%H%M)" "$file"
  else
    touch -d "$days_ago days ago" "$file"
  fi
}

# Project 1: web-shop (e-commerce app)
create_session "-Users-alex-projects-web-shop" "a1b2c3d4" "feat/cart-checkout" "/Users/alex/projects/web-shop" 0 \
  "user" "Add a shopping cart checkout flow with Stripe integration" \
  "assistant" "I'll help you build the checkout flow. Let me start by looking at your existing cart state management and then we'll integrate Stripe Elements for the payment form." \
  "user" "The cart items are stored in a Zustand store, can you see it?" \
  "assistant" "Yes, I can see your cart store. I'll create a CheckoutPage component that reads from the cart store, calculates totals, and renders a Stripe payment form. Let me also add server-side payment intent creation." \
  "user" "Perfect, also add order confirmation email" \
  "assistant" "I'll add a Resend email template for order confirmation. The flow will be: payment success webhook -> create order record -> send confirmation email with order details."

create_session "-Users-alex-projects-web-shop" "e5f6g7h8" "fix/inventory-sync" "/Users/alex/projects/web-shop" 2 \
  "user" "Products are showing as in stock when they are actually sold out" \
  "assistant" "This looks like a race condition in the inventory sync. When two users purchase simultaneously, the stock count isn't being decremented atomically. I'll add optimistic locking to the inventory update query." \
  "user" "That fixed it, thanks!" \
  "assistant" "Great! I also added a database constraint to prevent negative stock values as a safety net."

# Project 2: api-gateway
create_session "-Users-alex-projects-api-gateway" "i9j0k1l2" "main" "/Users/alex/projects/api-gateway" 1 \
  "user" "Set up rate limiting middleware with Redis" \
  "assistant" "I'll implement a sliding window rate limiter using Redis sorted sets. This gives more accurate rate limiting than fixed windows. Let me create the middleware and the Redis adapter." \
  "user" "Can we make it configurable per route?" \
  "assistant" "Absolutely. I'll add a route-level configuration that lets you set different limits per endpoint. For example, /auth/login can have stricter limits than /api/products." \
  "user" "Also add IP-based and API-key-based limiting" \
  "assistant" "I'll support both strategies. IP-based for public endpoints, API-key-based for authenticated routes. The middleware will check headers and fall back to IP if no key is present."

create_session "-Users-alex-projects-api-gateway" "m3n4o5p6" "feat/health-check" "/Users/alex/projects/api-gateway" 5 \
  "user" "Add health check endpoints for all downstream services" \
  "assistant" "I'll create a /health endpoint that aggregates the status of all downstream services. Each service check will have a timeout and the overall health will be degraded if any dependency is unhealthy."

# Project 3: mobile-app (React Native)
create_session "-Users-alex-projects-mobile-app" "q7r8s9t0" "feat/push-notifications" "/Users/alex/projects/mobile-app" 1 \
  "user" "Implement push notifications with Firebase Cloud Messaging" \
  "assistant" "I'll set up FCM for both iOS and Android. First, let me configure the native modules, then create a notification service that handles foreground and background messages." \
  "user" "Can we also handle deep linking from notifications?" \
  "assistant" "Yes, I'll add deep link parsing to the notification handler. When a user taps a notification, it will navigate to the relevant screen based on the payload data." \
  "user" "Show me how to test this locally" \
  "assistant" "For local testing, you can use the Firebase console to send test messages. I'll also create a script that sends test notifications via the FCM HTTP API so you can automate it."

create_session "-Users-alex-projects-mobile-app" "u1v2w3x4" "fix/dark-mode-colors" "/Users/alex/projects/mobile-app" 3 \
  "user" "Some text is invisible in dark mode on the settings screen" \
  "assistant" "The issue is that hardcoded color values are used instead of theme tokens. I'll replace all instances of #333 and #000 with the appropriate theme variables so they adapt to the color scheme."

# Project 4: data-pipeline
create_session "-Users-alex-projects-data-pipeline" "y5z6a7b8" "feat/etl-dashboard" "/Users/alex/projects/data-pipeline" 0 \
  "user" "Create a monitoring dashboard for our ETL pipeline jobs" \
  "assistant" "I'll build a dashboard showing job status, execution times, row counts, and error rates. We can use Grafana with the existing Prometheus metrics, or build a lightweight custom UI." \
  "user" "Let's go with a custom UI using React and Chart.js" \
  "assistant" "Good choice for a focused dashboard. I'll create components for: job timeline view, throughput charts, error log table, and a real-time status indicator for active jobs."

create_session "-Users-alex-projects-data-pipeline" "c9d0e1f2" "main" "/Users/alex/projects/data-pipeline" 7 \
  "user" "Our CSV import is failing on files larger than 2GB" \
  "assistant" "The issue is that the entire file is being loaded into memory. I'll switch to a streaming parser that processes the CSV line by line using Node.js readable streams. This will handle files of any size with constant memory usage."

# Project 5: docs-site
create_session "-Users-alex-projects-docs-site" "g3h4i5j6" "feat/search" "/Users/alex/projects/docs-site" 4 \
  "user" "Add full-text search to our documentation site" \
  "assistant" "I'll integrate Pagefind for client-side search. It indexes at build time and provides fast, typo-tolerant search with zero server dependencies. Let me configure it with your VitePress setup."

# Project 6: infra-terraform
create_session "-Users-alex-projects-infra-terraform" "k7l8m9n0" "feat/staging-env" "/Users/alex/projects/infra-terraform" 6 \
  "user" "Set up a staging environment that mirrors production" \
  "assistant" "I'll create a new Terraform workspace for staging with scaled-down resources. The module structure will be shared between prod and staging using variable files for environment-specific values like instance sizes and replica counts."

echo "Generated $(find "$FIXTURES_DIR" -name '*.jsonl' | wc -l | tr -d ' ') fake sessions in $FIXTURES_DIR"
