# AWS deploy (Phase 10)

We already have working Docker images. AWS is where those images run on the internet.

Do not create Fargate or RDS until a billing alarm exists. Those stay on and can cost tens of dollars a month.

## Cost (be honest)

| Piece | What it is | Ballpark if left on |
| --- | --- | --- |
| ECR | Stores the two images | Cents |
| RDS Postgres | Cloud database | Often the largest bill |
| ECS Fargate | Runs the API and web containers | Hours × size |
| Load balancer | Public URL | Often ~$16 / month |

A $10 monthly budget alarm is the first paid thing we create.

## Cheaper for one teacher

Ly teaching 6th and 7th math does not need ECS. A few parents booking each week can run on one small always-on box.

| Option | About / month | When to use it |
| --- | --- | --- |
| `pnpm docker:app` on this Mac | $0 | Ly tries it at home. Parents cannot book unless the Mac is on. |
| One VPS (Hetzner, DigitalOcean, or AWS Lightsail) running the same Compose file | **$5–12** | Parents book from their phones. Best fit for one teacher. |
| Full AWS (Fargate + RDS + load balancer) | **$45–75** | A school pays, or you want a public AWS URL on a resume. |

We already have the production images. The cheap path is “run `pnpm docker:app` on a $6 server,” not rebuild the app.

If real parent names and emails go on a public server later, the school should approve that first. The demo stays fictional.

## 1. Create an AWS account

1. Open [aws.amazon.com](https://aws.amazon.com/) and choose **Create an AWS account**.
2. Use your email. AWS will ask for a credit card. That is normal. We will cap spend with a budget.
3. Choose the **Free** support plan.
4. Sign in to the [AWS console](https://console.aws.amazon.com/).

## 2. Create a $10 budget alarm (do this first)

1. In the console search bar, type **Billing**.
2. Open **Budgets**.
3. Create a budget:
   - Type: **Cost budget**
   - Amount: **$10**
   - Email: yours
4. Save it.

If you get that email, we stop creating resources.

## 3. Confirm the AWS CLI on this Mac

The CLI is installed. In a new terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
aws --version
```

You should see `aws-cli/2`.

Then we will run `aws configure` together (access key, secret, region). Do not paste those keys into chat.

## Region

We will use `us-west-2` (Oregon). Pick one region and stay there so we do not pay for two copies.

## What we will build next (after the budget)

```text
GitHub Actions
    |
    v
ECR (image store)
    |
    +-- web image
    +-- api image
    |
    v
ECS Fargate  +  RDS Postgres
    |
    v
Public URL
```

Reply **account ready** when the AWS account and $10 budget exist. Then we log the CLI in and create ECR only.
