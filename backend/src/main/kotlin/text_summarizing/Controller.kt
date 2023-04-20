package text_summarizing

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
class Controller(
        @Autowired val userService: UserService,
        @Autowired val summarizedTextRep: SummarizedTextRep,
        @Autowired val pageableValidator: PageableValidator,
        @Autowired val summarizeService: SummarizeService
) {
    @PostMapping("/registration")
    fun registration() = userService.createNewUser()

    @GetMapping("get_all_summarizing")
    fun getAllSummarizing(@PageableDefault(size = 20) pageable: Pageable) =
            pageable
                    .apply(pageableValidator::validate)
                    .let { summarizedTextRep.findAllByUserOrderByTimeCreateUtc(userService.getCurrentUser(), it) }
                    .let { ResponseEntity.ok(it) }

    @PostMapping("summarize")
    fun summarize(@RequestParam("file") multipartFile: MultipartFile): ResponseEntity<Unit> {
        summarizeService.summarize(multipartFile)
        return ResponseEntity.ok().build()
    }
}

@Component
class PageableValidator(@Value("\${max.page.size}") val maxPageSize: Int) {
    fun validate(pageable: Pageable) {
        with(pageable.pageSize) {
            if (this > maxPageSize) {
                throw PageSizeToBig(this)
            }
        }
    }
}

class PageSizeToBig(pageSize: Int) : Exception("Value $pageSize is too big")