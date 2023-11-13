import { createMachine } from "@zag-js/core"
import { compact, isEqual } from "@zag-js/utils"
import type { MachineContext, MachineState, UserDefinedContext } from "./pagination.types"

export function machine(userContext: UserDefinedContext) {
  const ctx = compact(userContext)
  return createMachine<MachineContext, MachineState>(
    {
      id: "pagination",
      initial: "idle",
      context: {
        pageSize: 10,
        siblingCount: 1,
        currentPage: 1,
        type: "button",
        translations: {
          rootLabel: "pagination",
          prevTriggerLabel: "previous page",
          nextTriggerLabel: "next page",
          itemLabel({ page, totalPages }) {
            const isLastPage = totalPages > 1 && page === totalPages
            return `${isLastPage ? "last page, " : ""}page ${page}`
          },
          ...ctx.translations,
        },
        ...ctx,
      },

      watch: {
        pageSize: ["setPageIfNeeded"],
      },

      computed: {
        totalPages: (ctx) => Math.ceil(ctx.count / ctx.pageSize),
        previousPage: (ctx) => (ctx.currentPage === 1 ? null : ctx.currentPage - 1),
        nextPage: (ctx) => (ctx.currentPage === ctx.totalPages ? null : ctx.currentPage + 1),
        pageRange: (ctx) => {
          const start = (ctx.currentPage - 1) * ctx.pageSize
          const end = start + ctx.pageSize
          return { start, end }
        },
        isValidPage: (ctx) => ctx.currentPage >= 1 && ctx.currentPage <= ctx.totalPages,
      },

      on: {
        SET_COUNT: [
          {
            guard: "isValidCount",
            actions: ["setCount", "goToFirstPage"],
          },
          {
            actions: "setCount",
          },
        ],
        SET_PAGE: {
          guard: "isValidPage",
          actions: "setPage",
        },
        SET_PAGE_SIZE: {
          actions: "setPageSize",
        },
        PREVIOUS_PAGE: {
          guard: "canGoToPrevPage",
          actions: "goToPrevPage",
        },
        NEXT_PAGE: {
          guard: "canGoToNextPage",
          actions: "goToNextPage",
        },
      },

      states: {
        idle: {},
      },
    },
    {
      guards: {
        isValidPage: (ctx, evt) => evt.page >= 1 && evt.page <= ctx.totalPages,
        isValidCount: (ctx, evt) => ctx.currentPage > evt.count,
        canGoToNextPage: (ctx) => ctx.currentPage < ctx.totalPages,
        canGoToPrevPage: (ctx) => ctx.currentPage > 1,
      },
      actions: {
        setCount(ctx, evt) {
          ctx.count = evt.count
        },
        setPage(ctx, evt) {
          set.page(ctx, evt.page)
        },
        setPageSize(ctx, evt) {
          ctx.pageSize = evt.size
        },
        goToFirstPage(ctx) {
          set.page(ctx, 1)
        },
        goToPrevPage(ctx) {
          set.page(ctx, ctx.currentPage - 1)
        },
        goToNextPage(ctx) {
          set.page(ctx, ctx.currentPage + 1)
        },
        setPageIfNeeded(ctx, _evt) {
          if (ctx.isValidPage) return
          set.page(ctx, 1)
        },
      },
    },
  )
}

const set = {
  page: (ctx: MachineContext, value: number) => {
    if (isEqual(ctx.currentPage, value)) return
    ctx.currentPage = value
    ctx.onPageChange?.({ page: ctx.currentPage, pageSize: ctx.pageSize })
  },
}
