FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=5001
ENV BACKEND_API_URL=http://backend:5000

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"] 