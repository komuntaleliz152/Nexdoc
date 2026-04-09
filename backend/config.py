from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_model: str = "mistralai/mistral-7b-instruct:free"
    chroma_persist_dir: str = "./chroma_db"
    output_dir: str = "./outputs"

    class Config:
        env_file = ".env"

settings = Settings()
