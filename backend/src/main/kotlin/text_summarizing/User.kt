package text_summarizing

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.stereotype.Repository
import org.springframework.stereotype.Service
import java.util.*

@Entity(name = "user_table")
data class UserEntity(@Id @Column(nullable = false, length = 36) val id: String)

@Repository
interface UserRep : JpaRepository<UserEntity, String>

interface UUIDGenerator {
    fun generate(): String

    @Component
    class Default : UUIDGenerator {
        override fun generate() = UUID.randomUUID().toString()
    }
}

@Service
class UserService(@Autowired val userRep: UserRep, @Autowired val uuidGenerator: UUIDGenerator) {
    val logger: Logger = LoggerFactory.getLogger(UserService::class.java)
    fun createNewUser() = userRep
            .save(UserEntity(uuidGenerator.generate()))
            .apply { logger.info("New user $id is created") }

    fun getCurrentUser() = SecurityContextHolder.getContext().authentication.principal as UserEntity
}