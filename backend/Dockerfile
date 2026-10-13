FROM python:3.12-slim

WORKDIR /code

# Сначала только requirements — чтобы кэш работал
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Потом код — меняется чаще, кэш переиспользуется
COPY ./app /code/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]