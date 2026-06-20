FROM python:3.12-slim

WORKDIR /usr/src/app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install pg_isready (postgres client) so we can wait for DB readiness
RUN apt-get update \
	&& apt-get install -y --no-install-recommends postgresql-client \
	&& rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 8080
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
CMD ["/usr/local/bin/entrypoint.sh"]
