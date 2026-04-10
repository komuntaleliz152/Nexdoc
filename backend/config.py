from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    chroma_persist_dir: str = "./chroma_db"
    output_dir: str = "./outputs"

    class Config:
        env_file = ".env"

settings = Settings()
